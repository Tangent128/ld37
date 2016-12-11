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

    // present
    Desk = new Array<InventoryItemType>();

    // future

    // misc
    Inventory = [
        InventoryItemType.Shovel,
        InventoryItemType.Screwdriver,
        InventoryItemType.Seed,
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

    let entity = room.makeDummyObject(color, x, y, name);
    room.assignInventoryItem(entity, type, list);
    MarkGenerated(entity);
    return entity;
};

function PopulateDropTarget(
    room: GuiRoom<GameState>,
    list: InventoryItemType[],
    target: Mouse.HasTarget
) {
    let bounds = target.ClickTarget.bounds;
    let x = bounds.x;
    let y = bounds.y + bounds.h / 2;

    list.map(item => {
        let entity = PopulateItem(room, item, x, y, list);
        entity.ClickTarget.layer = target.ClickTarget.layer;
        x = x + 32;
    });
};

function GenerateDropTarget(
    room: GuiRoom<GameState>,
    list: InventoryItemType[],
    bounds: Render.Box
) {
    let target = room.makeInventoryDropper(bounds, list);
    MarkGenerated(target);

    PopulateDropTarget(room, list, target);
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

function GenerateRoom(room: GuiRoom<GameState>) {

    let State = room.State;

    // remove entities to rebuild
    room.Entities.map(entity => {
        if(IsGenerated(entity)) {
            (entity as ECS.Entity).deleted = true;
        }
    });

    switch(State.TimePeriod) {
        case TimePeriod.Alchemy:
            break;

        case TimePeriod.Present:

            GenerateDropTarget(room, State.Desk, new Render.Box(300,150, 128,25));

            break;

        case TimePeriod.Future:
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
