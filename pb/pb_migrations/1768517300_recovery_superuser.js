/// <reference path="../pb_data/types.d.ts" />
/**
 * RECOVERY MIGRATION
 * This script ensures a superuser exists with the credentials defined in environment variables.
 */
migrate((app) => {
    const email = $os.getenv("PB_ADMIN_EMAIL");
    const password = $os.getenv("PB_ADMIN_PASSWORD");

    if (!email || !password) {
        console.log("⚠️ Recovery skipped: PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD not set in environment.");
        return;
    }

    const collection = app.findCollectionByNameOrId("_superusers");
    
    try {
        // Try to find existing record
        const record = app.findAuthRecordByEmail("_superusers", email);
        console.log(`🔐 Recovery: Updating existing superuser password for ${email}`);
        record.set("password", password);
        app.save(record);
    } catch (err) {
        // Create new if not found
        console.log(`🔐 Recovery: Creating new superuser ${email}`);
        const record = new Record(collection);
        record.set("email", email);
        record.set("password", password);
        app.save(record);
    }
}, (app) => {
    // Revert not needed for recovery
    return null;
});
