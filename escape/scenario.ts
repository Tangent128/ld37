/// <reference path="../src/index.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./gui-room.ts" />

enum TimePeriod {
    Alchemy,
    Present,
    Future
};
class GameState {

    // time period
    TimePeriod = TimePeriod.Present;

    // past
    PastTable = new Array<InventoryItemType>();
    PastHole = new Array<InventoryItemType>();
    PastTimeCapsule = [
    ];

    TimeCapsuleUncovered = false;
    TimeCapsuleViewed = false;

    // present
    PresentTable = new Array<InventoryItemType>();
    PresentDesk = new Array<InventoryItemType>();

    DinosaurSummoned = false;

    // future
    FutureTable = [
        InventoryItemType.Shovel,
    ];
    FutureVault = [
        InventoryItemType.Seed,
    ];
    FutureDinosaur = new Array<InventoryItemType>();

    // misc
    Inventory = [
        InventoryItemType.Screwdriver,
        InventoryItemType.Lead,
        InventoryItemType.Gold
    ];

    // permanent objects
    InventoryBox: Mouse.HasTarget;
};

interface IsGenerated {
    Generated: true
};
function IsGenerated(entity: any): entity is IsGenerated {
    return entity.Generated == true;
};
function MarkGenerated(entity: any) {
    entity.Generated = true;
};

function GenerateItem(
    room: GuiRoom<GameState>,
    color: string, x: number, y: number, label: string,
    callback: (clickedBy: Mouse.IsCursor) => void = null
) {
    let entity = room.makeDummyObject(color, x, y, label);
    MarkGenerated(entity);
    if(callback) {
        room.onClick(entity, callback);
    }
    return entity;
};

function PopulateItem(
    room: GuiRoom<GameState>,
    type: InventoryItemType,
    x: number, y: number,
    list: InventoryItemType[]
) {
    let color = "#000";
    let name = InventoryItemType[type];

    switch (type) {
        case InventoryItemType.Shovel:
            color = "#888";
            break;
    }

    let entity = GenerateItem(room, color, x, y, name);
    room.assignInventoryItem(entity, type, list);
    return entity;
};

function PopulateDropTarget(
    room: GuiRoom<GameState>,
    list: InventoryItemType[],
    target: Mouse.HasTarget,
    layer: Render.Layer = null
) {
    let bounds = target.ClickTarget.bounds;
    let x = bounds.x + 20;
    let y = bounds.y + bounds.h / 2;

    let itemLayer = layer || room.RoomLayer;

    list.map(item => {
        let entity = PopulateItem(room, item, x, y, list);
        entity.RenderDebugBox.Layer = itemLayer;
        entity.RenderText.Layer = itemLayer;
        entity.ClickTarget.layer = target.ClickTarget.layer;
        x = x + 40;
    });
};

function GenerateDropTarget(
    room: GuiRoom<GameState>,
    list: InventoryItemType[],
    bounds: Render.Box,
    uiLayer = Mouse.UiLayer.Room,
    renderLayer: Render.Layer = null
) {
    let target = room.makeInventoryDropper(bounds, list, uiLayer);
    MarkGenerated(target);

    PopulateDropTarget(room, list, target, renderLayer);
    return target;
};

function ToObjectLayer(room: GuiRoom<GameState>, entity: any) {
    if(Mouse.HasTarget(entity)) {
        entity.ClickTarget.layer = Mouse.UiLayer.Object;
    }
    if(RenderDebug.HasBox(entity)) {
        entity.RenderDebugBox.Layer = room.ObjectLayer;
    }
    if(Textbox.HasText(entity)) {
        entity.RenderText.Layer = room.ObjectLayer;
    }
};

function PopupTimeMachine(room: GuiRoom<GameState>) {

    let cancel: Function;

    let root = room.makeDummyObject("#40a", 750, 150, "Time Machine");
    ToObjectLayer(room, root);
    Slide.Slide(root, 200, 250, 40);

    // buttons
    let alchemy = room.makeDummyObject("#880", 0, 0, "Alchemy");
    ToObjectLayer(room, alchemy);
    Pin.Attach(root, alchemy, 150, -70);
    room.onClick(alchemy, clickedBy => {
        if(clickedBy == null) {
            room.State.TimePeriod = TimePeriod.Alchemy;
            GenerateRoom(room);
            cancel();
        }
    });

    let present = room.makeDummyObject("#fcc", 0, 0, "Present");
    ToObjectLayer(room, present);
    Pin.Attach(root, present, 150, 0);
    room.onClick(present, clickedBy => {
        if(clickedBy == null) {
            room.State.TimePeriod = TimePeriod.Present;
            GenerateRoom(room);
            cancel();
        }
    });

    let future = room.makeDummyObject("#0fa", 0, 0, "Future");
    ToObjectLayer(room, future);
    Pin.Attach(root, future, 150, 70);
    room.onClick(future, clickedBy => {
        if(clickedBy == null) {
            room.State.TimePeriod = TimePeriod.Future;
            GenerateRoom(room);
            cancel();
        }
    });

    let back = room.makeDummyObject("#440", 0, 0, "Cancel");
    ToObjectLayer(room, back);
    Pin.Attach(root, back, 70, 70);
    room.onClick(back, clickedBy => {
        if(clickedBy == null) {
            cancel();
        }
    });

    cancel = () => {
        Slide.Slide(root, -250, 250, 40, () => {
            root.deleted = true;
            alchemy.deleted = true;
            present.deleted = true;
            future.deleted = true;
            back.deleted = true;
        });
    };
};

function PopupTimeCapsule(room: GuiRoom<GameState>) {
    let cancel: Function;

    let root = room.makeDummyObject("#40a", 200, 150, "Time capsule");
    ToObjectLayer(room, root);

    let contents = GenerateDropTarget(
        room, room.State.FutureVault,
        new Render.Box(200, 200, 80, 32),
        Mouse.UiLayer.Object,
        room.ObjectLayer
    );
    ToObjectLayer(room, contents);

    let back = room.makeDummyObject("#440", 270, 170, "Close");
    ToObjectLayer(room, back);
    room.onClick(back, clickedBy => {
        if(clickedBy == null) {
            cancel();
        }
    });

    cancel = () => {
        root.deleted = true;
        back.deleted = true;
        GenerateRoom(room);
    };
};

function PopupSeedVault(room: GuiRoom<GameState>) {
    let cancel: Function;

    let funded = room.State.PresentDesk.indexOf(InventoryItemType.Gold) >= 0;

    let label = funded
        ? "Seed Vault! Well funded with lots of seeds!"
        : "Seed Vault! No actual seeds, alas. Budget cuts.";

    let root = room.makeDummyObject("#40a", 200, 150, label);
    ToObjectLayer(room, root);

    if(funded) {
        let vault = GenerateDropTarget(
            room, room.State.FutureVault,
            new Render.Box(200, 200, 80, 32),
            Mouse.UiLayer.Object,
            room.ObjectLayer
        );
        ToObjectLayer(room, vault);
    }

    let back = room.makeDummyObject("#440", 270, 170, "Close");
    ToObjectLayer(room, back);
    room.onClick(back, clickedBy => {
        if(clickedBy == null) {
            cancel();
        }
    });

    cancel = () => {
        root.deleted = true;
        back.deleted = true;
        GenerateRoom(room);
    };
};

function GenerateRoom(room: GuiRoom<GameState>) {

    let State = room.State;

    // remove entities to rebuild
    room.Entities.map(entity => {
        if(IsGenerated(entity)) {
            (entity as ECS.Entity).deleted = true;
        }
    });

    // calc flags
    let seedPlanted = State.PastHole.indexOf(InventoryItemType.Seed) > -1;

    // add items
    switch(State.TimePeriod) {
        case TimePeriod.Alchemy:

            GenerateDropTarget(room, State.PastHole, new Render.Box(250,200, 25,25));

            break;

        case TimePeriod.Present:

            GenerateItem(room, "#444", 450, 30, "Ventilation Duct", clickedBy => {
                if(!seedPlanted) {
                    room.showMessageBox("It's out of reach!");
                    return;
                }
                if(IsInventoryItem(clickedBy, InventoryItemType.Screwdriver)) {
                    room.showMessageBox("Working the grate off with the screwdriver,\nyou open up a path to freedom!", () => {
                        ResetGame(room);
                    });
                } else {
                    room.showMessageBox("The grate's screwed on tightly.");
                }
            });

            if(seedPlanted) {
                GenerateItem(room, "#4a0", 450, 100, "Beanstalk");
            }

            GenerateDropTarget(room, State.PresentDesk, new Render.Box(300,150, 128,25));

            break;

        case TimePeriod.Future:

            GenerateItem(room, "#44f", 450, 100, "Seed Vault", clickedBy => {
                if(clickedBy == null) {
                    PopupSeedVault(room);
                }
            });
            GenerateItem(room, "#aa0", 450, 270, "Time Machine", clickedBy => {
                if(clickedBy == null) {
                    PopupTimeMachine(room);
                }
            });


            break;
    }

    // regenerate inventory
    PopulateDropTarget(room, State.Inventory, State.InventoryBox);
};

function ResetGame(room: GuiRoom<GameState>) {

    // delete everything
    room.Entities.map(entity => {
        entity.deleted = true;
    });

    room.State = new GameState();

    let triggerBox = room.makeDummyObject("#000", 0, 0, "Trigger");
    room.onClick(triggerBox, clickedWith => {
        if(clickedWith == null) {
            PopupTimeMachine(room);
        }
    });

    let State = room.State;

    State.InventoryBox = room.makeInventoryDropper(
        new Render.Box(0,300, 500,100),
        room.State.Inventory,
        null
    );

    GenerateRoom(room);
};
