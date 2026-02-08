/// <reference path="../pb_data/types.d.ts" />

/**
 * Sync Admin Credentials on Startup
 * 
 * This hook ensures that the Admin account specified in environment variables
 * (PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD) is always present and has the correct password.
 * 
 * This solves the issue where restoring a backup from local (with local creds)
 * overwrites the remote credentials. This hook runs after every restart/restore
 * and resets them to the correct values for that environment.
 */
onAfterBootstrap((e) => {
    const email = $os.getenv("PB_ADMIN_EMAIL");
    const password = $os.getenv("PB_ADMIN_PASSWORD");

    if (!email || !password) {
        return;
    }

    try {
        const superusers = $app.findCollectionByNameOrId("_superusers");
        
        try {
            // Update existing
            const admin = $app.findAuthRecordByEmail("_superusers", email);
            if (admin.validatePassword(password)) {
                return; // Already correct
            }
            console.log(`[Sync] Updating password for ${email}`);
            admin.set("password", password);
            $app.save(admin);
        } catch (err) {
            // Create new
            console.log(`[Sync] Creating superuser ${email}`);
            const admin = new Record(superusers);
            admin.set("email", email);
            admin.set("password", password);
            $app.save(admin);
        }
    } catch (err) {
        console.warn("[Sync] Failed to sync admin:", err);
    }
})
