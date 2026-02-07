/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const email = $os.getenv("PB_ADMIN_EMAIL");
    const password = $os.getenv("PB_ADMIN_PASSWORD");

    if (!email || !password) {
        return;
    }

    const superusers = app.findCollectionByNameOrId("_superusers");

    try {
        const admin = app.findAuthRecordByEmail("_superusers", email);
        admin.set("password", password);
        app.save(admin);
    } catch {
        const admin = new Record(superusers);
        admin.set("email", email);
        admin.set("password", password);
        app.save(admin);
    }
}, (app) => {
    // optional revert
})
