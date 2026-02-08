/// <reference path="../pb_data/types.d.ts" />

// Creates the 'messages' collection for the Talk chat feature.
// Open list/view rules (public chat), no auth required to create (session enforced at app level).
migrate((app) => {
    const collection = new Collection({
        name: "messages",
        type: "base",
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
        fields: [
            {
                autogeneratePattern: "[a-z0-9]{15}",
                hidden: false,
                id: "text3208210256",
                max: 15,
                min: 15,
                name: "id",
                pattern: "^[a-z0-9]+$",
                presentable: false,
                primaryKey: true,
                required: true,
                system: true,
                type: "text"
            },
            {
                autogeneratePattern: "",
                hidden: false,
                id: "text_username",
                max: 50,
                min: 1,
                name: "username",
                pattern: "",
                presentable: false,
                primaryKey: false,
                required: true,
                system: false,
                type: "text"
            },
            {
                autogeneratePattern: "",
                hidden: false,
                id: "text_message",
                max: 5000,
                min: 1,
                name: "text",
                pattern: "",
                presentable: false,
                primaryKey: false,
                required: true,
                system: false,
                type: "text"
            }
        ],
        indexes: []
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("messages");
    return app.delete(collection);
});
