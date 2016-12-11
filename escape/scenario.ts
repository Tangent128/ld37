/// <reference path="../src/index.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./gui-room.ts" />

class GameState {
    Desk = new Array<InventoryItemType>();
    Inventory = new Array<InventoryItemType>();

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

function GenerateRoom(room: GuiRoom<GameState>) {

    let state = room.State;

    // remove entities to rebuild
    room.Entities.map(entity => {
        if(IsGenerated(entity)) {
            (entity as ECS.Entity).deleted = true;
        }
    });

    // shelf
    GenerateDropTarget(room, state.Desk, new Render.Box(300,150, 128,25));

    // regenerate inventory
    PopulateDropTarget(room, state.Inventory, state.InventoryBox);
};

function ResetGame(room: GuiRoom<GameState>) {

    room.Entities.length = 0;

    let triggerBox = room.makeDummyObject("#000", 0, 0, "Trigger");
    room.onClick(triggerBox, clickedWith => {
        if(clickedWith == null) {
            GenerateRoom(room);
        }
    });

    let State = room.State;

    State.Inventory = [
        InventoryItemType.Shovel,
        InventoryItemType.Screwdriver,
        InventoryItemType.Seed,
        InventoryItemType.Lead,
        InventoryItemType.Gold
    ];

    State.InventoryBox = room.makeInventoryDropper(
        new Render.Box(0,300, 500,100),
        room.State.Inventory,
        null
    );

    GenerateRoom(room);
};
