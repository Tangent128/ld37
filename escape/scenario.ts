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
    FutureDinosaur = [
        InventoryItemType.Lead,
    ];

    // misc
    Inventory = [
        InventoryItemType.Screwdriver,
        InventoryItemType.Gold
    ];

    // permanent objects
    InventoryBox: Mouse.HasTarget;

    AlchemyBg = RenderImage.load("img/alchemy.png");
    AlchemyBgCapsule = RenderImage.load("img/wcapsule.png");
    PresentBg = RenderImage.load("img/present.png");
    PresentBgDino = RenderImage.load("img/wdino.png");
    PresentBgBean = RenderImage.load("img/wbeanstalk.png");
    FutureBg = RenderImage.load("img/future.png");
    FutureBgDino = RenderImage.load("img/wskel.png");

    DialogBg = RenderImage.load("img/dialog.png");
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

function GenerateClickZone(
    room: GuiRoom<GameState>,
    x: number, y: number, w: number, h: number,
    callback: (clickedBy: Mouse.IsCursor) => void = (clickedBy) => {},
    uiLayer = Mouse.UiLayer.Room,
    renderLayer = null
) {
    renderLayer = renderLayer || room.RoomLayer;

    let bounds = new Render.Box(0,0,w,h);

    let entity = {
        Location: new ECS.Location(x, y),
        Generated: true,
        ClickTarget: new Mouse.ClickTarget(uiLayer, bounds, callback),
        RenderDebugBox: new RenderDebug.Box(renderLayer, bounds, "rgba(255,0,0,0.5)")
    };
    room.add(entity);
    return entity;
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
        case InventoryItemType.Seed:
            color = "#0f0";
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
    renderLayer = renderLayer || room.RoomLayer;
    let target = room.makeInventoryDropper(bounds, list, uiLayer, renderLayer);
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

function PopupItemBox(
    room: GuiRoom<GameState>,
    list: InventoryItemType[],
    text: string
) {
    let cancel: Function;

    let root = {
        Generated: true,
        Location: new ECS.Location(0, 0),
        RenderImage: new RenderImage.RenderImage(
            room.ObjectBgLayer, room.State.DialogBg,
            0, 0, 500, 400
        )
    };
    room.add(root);

    let message = {
        Generated: true,
        Location: new ECS.Location(250, 50+16),
        RenderText: new Textbox.Text(room.ObjectLayer, text)
    };
    room.add(message);

    let contents = GenerateDropTarget(
        room, list,
        new Render.Box(200, 180, 100, 30),
        Mouse.UiLayer.Object,
        room.ObjectLayer
    );
    ToObjectLayer(room, contents);

    let dismissBox = new Render.Box(210, 225, 80, 30);
    let back = {
        Generated: true,
        ClickTarget: new Mouse.ClickTarget(
            Mouse.UiLayer.Object,
            dismissBox,
            clickedBy => {
                if (clickedBy == null) {
                    GenerateRoom(room);
                }
            }
        )
    };
    room.add(back);

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
    let funded = room.State.PresentDesk.indexOf(InventoryItemType.Gold) >= 0;

    let seedPlanted = State.PastHole.indexOf(InventoryItemType.Seed) > -1;

    let background: HTMLImageElement = null;

    // add items
    switch(State.TimePeriod) {
        case TimePeriod.Alchemy:

            background = State.AlchemyBg;

            GenerateDropTarget(room, State.PastHole, new Render.Box(250,200, 25,25));

            break;

        case TimePeriod.Present:

            background = State.PresentBg;

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

            GenerateDropTarget(room, State.PresentTable, new Render.Box(220,124, 142,28));
            GenerateDropTarget(room, State.PresentDesk, new Render.Box(261,176, 49,85));

            break;

        case TimePeriod.Future:

            background = State.FutureBg;

            GenerateItem(room, "#44f", 450, 100, "Seed Vault", clickedBy => {
                if(clickedBy == null) {
                    if(funded) {
                        PopupItemBox(room, room.State.FutureVault,
                            "Seed Vault! Well funded with lots of seeds!");
                    } else {
                        room.showMessageBox(
                            "Seed Vault! No actual seeds, alas. Budget cuts.");
                    }
                }
            });

            break;
    }

    // regenerate inventory
    PopulateDropTarget(room, State.Inventory, State.InventoryBox);

    // background
    if(background) {
        room.add({
            RenderImage: new RenderImage.RenderImage(
                room.BackgroundLayer, background,
                0, 0, 500, 400
            ),
            Generated: true
        });
    }

    // time machine
    GenerateClickZone(room, 428, 198, 57, 103, clickedBy => {
        if(clickedBy == null) {
            PopupTimeMachine(room);
        }
    });
};

function ResetGame(room: GuiRoom<GameState>) {

    // delete everything
    room.Entities.map(entity => {
        entity.deleted = true;
    });

    room.State = new GameState();

    room.State.InventoryBox = room.makeInventoryDropper(
        new Render.Box(0,300, 500,100),
        room.State.Inventory,
        null, room.RoomLayer
    );

    GenerateRoom(room);
};
