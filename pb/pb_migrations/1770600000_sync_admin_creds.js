/// <reference path="../pb_data/types.d.ts" />

/**
 * Sync Admin Credentials Post-Restore
 * 
 * This migration runs after the schema snapshot migration and ensures that
 * the admin account matches the environment variables on the current system.
 * 
 * This solves the issue where restoring a backup with different admin credentials
 * would overwrite the target system's admin account. This migration runs once
 * after a restore completes and resets credentials to match the current environment.
 */
migrate((app) => {
    const email = $os.getenv("PB_ADMIN_EMAIL");
    const password = $os.getenv("PB_ADMIN_PASSWORD");

    if (!email || !password) {
        return;
    }

    const superusers = app.findCollectionByNameOrId("_superusers");

    try {
        // Try to find and update existing
        const admin = app.findAuthRecordByEmail("_superusers", email);
        admin.set("password", password);
        app.save(admin);
        console.log(`✅ Admin password synced for ${email}`);
    } catch (err) {
        // Create new if not found
        const admin = new Record(superusers);
        admin.set("email", email);
        admin.set("password", password);
        app.save(admin);
        console.log(`✅ Admin created: ${email}`);
    }
}, (app) => {
    // Revert: optional
    return null;
});
