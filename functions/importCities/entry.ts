import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MAX_CITIES_PER_IMPORT = 5000;
const MAX_EXISTING_RECORDS = 50000;

/**
 * City Import Service
 *
 * Imports verified cities from a trusted dataset (orthodoxCities.js) into the
 * OrthodoxCities entity. This function:
 *   1. Only adds cities that don't already exist (matched by cityName + country).
 *   2. Never overwrites custom candle-lighting settings on existing records.
 *   3. Logs every change to a CityImportLog record and returns a detailed report.
 *
 * Payload: { cities: Array<{ cityName, country, stateProvince, latitude,
 *            longitude, elevationMeters, timezone, isIsrael,
 *            defaultCandleLightingMinutes }> }
 *
 * Admin-only — returns 403 for non-admin users.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const cities = Array.isArray(body?.cities) ? body.cities : [];

    if (cities.length === 0) {
      return Response.json({ error: 'No cities provided in payload' }, { status: 400 });
    }
    if (cities.length > MAX_CITIES_PER_IMPORT) {
      return Response.json({ error: `Import is limited to ${MAX_CITIES_PER_IMPORT} cities per request` }, { status: 413 });
    }

    console.log(`[importCities] Starting import of ${cities.length} cities from trusted dataset`);

    // --- 1. Fetch all existing OrthodoxCities records (paginated) ---
    const existing = [];
    let hasMore = true;
    let skip = 0;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.OrthodoxCities.list('-created_date', 200, skip);
      existing.push(...batch);
      hasMore = batch.length === 200;
      skip += 200;
      if (skip >= MAX_EXISTING_RECORDS) hasMore = false;
    }
    console.log(`[importCities] Found ${existing.length} existing cities in database`);

    // --- 2. Build duplicate-detection indexes ---
    // Two cities are duplicates if:
    //   (a) cityName + country are identical, OR
    //   (b) latitude AND longitude match within 0.001°

    const DUPLICATE_TOLERANCE = 0.001;

    // (a) Name+country lookup
    const existingByName = new Map();
    for (const c of existing) {
      const key = `${c.cityName}|${c.country}`;
      if (!existingByName.has(key)) existingByName.set(key, c);
    }

    // (b) Geo-grid lookup: round to 0.001° buckets for O(1) proximity check
    const existingByGeo = new Map();
    for (const c of existing) {
      if (c.latitude == null || c.longitude == null) continue;
      const bucket = `${c.latitude.toFixed(3)}|${c.longitude.toFixed(3)}`;
      if (!existingByGeo.has(bucket)) existingByGeo.set(bucket, c);
    }

    function findExistingDuplicate(city) {
      // Check by name+country
      const nameKey = `${city.cityName}|${city.country}`;
      const nameMatch = existingByName.get(nameKey);
      if (nameMatch) return { match: nameMatch, reason: 'name+country' };

      // Check by lat/lng proximity (scan nearby buckets within tolerance)
      const lat = city.latitude;
      const lng = city.longitude;
      const latRounded = Math.round(lat * 1000);
      const lngRounded = Math.round(lng * 1000);
      for (let dl = -1; dl <= 1; dl++) {
        for (let dg = -1; dg <= 1; dg++) {
          const bucket = `${(latRounded + dl) / 1000}|${(lngRounded + dg) / 1000}`;
          const geoMatch = existingByGeo.get(bucket);
          if (geoMatch &&
              Math.abs(geoMatch.latitude - lat) <= DUPLICATE_TOLERANCE &&
              Math.abs(geoMatch.longitude - lng) <= DUPLICATE_TOLERANCE) {
            return { match: geoMatch, reason: 'coordinates' };
          }
        }
      }
      return null;
    }

    // --- 3. Process each city from the dataset ---
    const toInsert = [];
    const skipped = [];
    const preservedCustom = [];
    const intraDatasetDupes = [];

    // Track cities we're about to insert to prevent intra-dataset duplicates
    const pendingByName = new Set();
    const pendingByGeo = new Set();

    for (const city of cities) {
      const lat = Number(city?.latitude);
      const lng = Number(city?.longitude);
      const validIdentity = typeof city?.cityName === 'string' && city.cityName.trim().length > 0 && city.cityName.length <= 120 &&
        typeof city?.country === 'string' && city.country.trim().length > 0 && city.country.length <= 120;
      const validCoordinates = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
      const validTimezone = typeof city?.timezone === 'string' && city.timezone.length <= 100;
      if (!validIdentity || !validCoordinates || !validTimezone) {
        console.log('[importCities] Skipping invalid city record');
        continue;
      }
      city.latitude = lat;
      city.longitude = lng;

      // Check against existing DB records
      const dup = findExistingDuplicate(city);

      // Check against cities already queued for insertion (intra-dataset dupes)
      const nameKey = `${city.cityName}|${city.country}`;
      const latRounded = Math.round(city.latitude * 1000);
      const lngRounded = Math.round(city.longitude * 1000);
      let intraDupe = false;
      if (pendingByName.has(nameKey)) intraDupe = true;
      if (!intraDupe) {
        for (let dl = -1; dl <= 1 && !intraDupe; dl++) {
          for (let dg = -1; dg <= 1 && !intraDupe; dg++) {
            const bucket = `${(latRounded + dl) / 1000}|${(lngRounded + dg) / 1000}`;
            if (pendingByGeo.has(bucket)) intraDupe = true;
          }
        }
      }

      if (dup) {
        // Duplicate of an existing DB record — skip (do NOT overwrite)
        skipped.push(city.cityName);

        const rawCandle = Number(city.defaultCandleLightingMinutes ?? city.candleOffset ?? 18);
        const datasetCandle = Number.isFinite(rawCandle) ? Math.max(0, Math.min(120, Math.round(rawCandle))) : 18;
        const dbCandle = dup.match.defaultCandleLightingMinutes;

        if (dbCandle != null && dbCandle !== datasetCandle) {
          preservedCustom.push({
            city: city.cityName,
            existing_offset: dbCandle,
            dataset_offset: datasetCandle,
          });
          console.log(`[importCities] Preserved custom candle-lighting for ${city.cityName}: DB=${dbCandle}min, dataset=${datasetCandle}min`);
        }
        console.log(`[importCities] Skipped duplicate "${city.cityName}" (matched by ${dup.reason})`);
      } else if (intraDupe) {
        // Duplicate within the dataset itself — skip
        intraDatasetDupes.push(city.cityName);
        console.log(`[importCities] Skipped intra-dataset duplicate: ${city.cityName}`);
      } else {
        // Not a duplicate — queue for insertion
        const rawCandle = Number(city.defaultCandleLightingMinutes ?? city.candleOffset ?? 18);
        const datasetCandle = Number.isFinite(rawCandle) ? Math.max(0, Math.min(120, Math.round(rawCandle))) : 18;
        const rawElevation = Number(city.elevationMeters ?? city.elevation ?? 0);
        const elevationMeters = Number.isFinite(rawElevation) ? Math.max(-500, Math.min(9000, Math.round(rawElevation))) : 0;
        toInsert.push({
          cityName: city.cityName,
          country: city.country,
          stateProvince: city.stateProvince || null,
          latitude: city.latitude,
          longitude: city.longitude,
          elevationMeters,
          timezone: city.timezone,
          isIsrael: city.isIsrael ?? false,
          isDiaspora: city.isIsrael ? false : true,
          enabled: city.enabled ?? true,
          defaultCandleLightingMinutes: datasetCandle,
          population: city.population ?? 0,
          communityType: city.communityType || 'local_community',
          isOrthodoxCenter: city.isOrthodoxCenter ?? false,
        });
        pendingByName.add(nameKey);
        pendingByGeo.add(`${(latRounded) / 1000}|${(lngRounded) / 1000}`);
      }
    }

    // --- 4. Bulk insert missing cities (in chunks of 100) ---
    let inserted = [];
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 100) {
        const chunk = toInsert.slice(i, i + 100);
        const result = await base44.asServiceRole.entities.OrthodoxCities.bulkCreate(chunk);
        inserted.push(...result);
      }
      console.log(`[importCities] Inserted ${inserted.length} new cities`);
    } else {
      console.log(`[importCities] No new cities to insert — all ${skipped.length} already exist`);
    }

    // --- 5. Log the import run to CityImportLog ---
    const details = `Imported ${inserted.length} new cities, skipped ${skipped.length} existing (duplicates), ${intraDatasetDupes.length} intra-dataset duplicates auto-skipped. ${preservedCustom.length} cities have custom candle-lighting offsets preserved (not overwritten).`;

    const logEntry = await base44.asServiceRole.entities.CityImportLog.create({
      source: 'orthodoxCities.js — verified dataset (Chabad/Hebcal)',
      imported_count: inserted.length,
      skipped_count: skipped.length,
      preserved_count: preservedCustom.length,
      total_in_dataset: cities.length,
      details,
    });

    console.log(`[importCities] Import complete. Log entry created: ${logEntry.id}`);

    // --- 6. Return detailed report ---
    return Response.json({
      success: true,
      imported: inserted.length,
      skipped: skipped.length,
      preserved_custom: preservedCustom.length,
      intra_dataset_duplicates: intraDatasetDupes.length,
      total_in_dataset: cities.length,
      log_id: logEntry.id,
      details,
      inserted_cities: inserted.map((c) => c.cityName),
      intra_dataset_duplicate_cities: intraDatasetDupes,
      preserved_custom_details: preservedCustom,
    });
  } catch (error) {
    console.error(`[importCities] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});