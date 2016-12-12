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
        InventoryItemType.Screwdriver,
        InventoryItemType.Bone,
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
    Inventory = new Array<InventoryItemType>();

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
    Buttons = RenderImage.load("img/buttons.png");
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

    let makeButton = (x, time: TimePeriod, clickFunc?) => {
        let button = {
            Location: new ECS.Location(150 + x,150),
            Generated: true,
            RenderImage: new RenderImage.RenderImage(
                room.ObjectLayer, room.State.Buttons,
                x, 0, 50, 50
            ),
            ClickTarget: new Mouse.ClickTarget(
                Mouse.UiLayer.Object,
                new Render.Box(0,0, 50, 50),
                clickFunc || (clickedBy => {
                    room.State.TimePeriod = time;
                    GenerateRoom(room);
                })
            )
        };
        room.add(button);
    };

    let root = {
        Generated: true,
        Location: new ECS.Location(0, 0),
        RenderImage: new RenderImage.RenderImage(
            room.ObjectBgLayer, room.State.DialogBg,
            0, 0, 500, 400
        )
    };
    room.add(root);

    // message
    let text = "It's a time machine!\n\nWhen would you like to go today?";
    let message = {
        Generated: true,
        Location: new ECS.Location(250, 50+16),
        RenderText: new Textbox.Text(room.ObjectLayer, text)
    };
    room.add(message);

    // buttons

    if(room.State.TimeCapsuleViewed && ! room.State.DinosaurSummoned) {
        makeButton(0, TimePeriod.Present, clickedBy => {
            room.showMessageBox(
`Dangit, the machine won't let you escape the room
via time travel. Instead, it summons the creature
of interest to the present.`);
            room.State.DinosaurSummoned = true;
            room.State.TimePeriod = TimePeriod.Present;
            GenerateRoom(room);
        });
    }
    makeButton(50, TimePeriod.Alchemy);
    makeButton(100, TimePeriod.Present);
    makeButton(150, TimePeriod.Future);

    // dismiss
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

            if(!State.TimeCapsuleUncovered) {
                GenerateClickZone(room, 329,254, 37,25, clickedBy => {
                    if(IsInventoryItem(clickedBy, InventoryItemType.Shovel)) {
                        State.TimeCapsuleUncovered = true;
                        // this has side-effect of deleting the shovel;
                        // acceptable for now, but technically a bug
                        GenerateRoom(room);
                    }
                });
            } else {
                background = State.AlchemyBgCapsule;

                GenerateDropTarget(room, State.PastHole, new Render.Box(329,254, 37,25));

                GenerateClickZone(room, 172, 190, 92, 100, clickedBy => {
                    if(clickedBy == null) {
                        State.TimeCapsuleViewed = true;
                        PopupItemBox(room, State.PastTimeCapsule,
`We leave this time capsule to be found by the future.
Included:
- A dazzling new invention, the screwdriver!
- A strange bone. From a big lizard?
Alchemy says it lived 67 million years ago.
And died of lead poisoning.
Another reason we must turn all lead to gold.`);
                    }
                });
            }

            GenerateClickZone(room, 235, 127, 60, 21, clickedBy => {
                if(clickedBy == null) {
                    room.showMessageBox(`It's an alchemist's table.`);
                } else if(IsInventoryItem(clickedBy, InventoryItemType.Lead)) {
                    room.assignInventoryItem(clickedBy, InventoryItemType.Gold);
                    (clickedBy as ECS.Entity).deleted = true;
                    State.PastTable.push(InventoryItemType.Gold);
                    GenerateRoom(room);
                }
            });

            GenerateDropTarget(room, State.PastTable, new Render.Box(299,127,60,21));

            break;

        case TimePeriod.Present:

            background = State.PresentBg;

            // news
            GenerateClickZone(room, 188, 231, 69, 54, clickedBy => {
                if(clickedBy == null) {
                    room.showMessageBox(`Newspaper.`);
                }
            });

            // duct
            GenerateClickZone(room, 412, 8, 69, 39, clickedBy => {
                if(!seedPlanted) {
                    room.showMessageBox("It's out of reach!");
                    return;
                }
                if(IsInventoryItem(clickedBy, InventoryItemType.Screwdriver)) {
                    room.showMessageBox(
`Working the grate off with the screwdriver,
you open up a path to freedom!

You Win! Resetting game...`, () => ResetGame(room));
                } else {
                    room.showMessageBox("The grate's screwed on tightly.");
                }
            });

            // dinosaur
            if(State.DinosaurSummoned) {
                background = State.PresentBgDino;

                GenerateClickZone(room, 27, 185, 151, 115, clickedBy => {
                    if(clickedBy == null) {
                        room.showMessageBox(`It's a very confused dinosaur.`);
                    }
                });
            }

            // beanstalk
            if(seedPlanted) {
                background = State.PresentBgBean;
                GenerateClickZone(room, 419, 49, 70, 152, clickedBy => {
                    if(clickedBy == null) {
                        room.showMessageBox(
`Though it was transplanted,
this beanstalk is still growing strong.`);
                    }
                });
            }

            GenerateDropTarget(room, State.PresentTable, new Render.Box(220,124, 142,28));
            GenerateDropTarget(room, State.PresentDesk, new Render.Box(261,176, 49,85));

            break;

        case TimePeriod.Future:

            background = State.FutureBg;

            if(State.DinosaurSummoned) {
                background = State.FutureBgDino;

                GenerateDropTarget(
                    room, State.FutureDinosaur, new Render.Box(61,264,96,29));
            }

            GenerateDropTarget(room, State.FutureTable, new Render.Box(208,124, 164,28));

            GenerateClickZone(room, 410, 44, 79, 151, clickedBy => {
                if(clickedBy == null) {
                    if(funded) {
                        PopupItemBox(room, room.State.FutureVault,
`It's a seed vault!
There are lots of seeds.
The beanstalk seeds look interesting.`);
                    } else {
                        room.showMessageBox(
`It might be a seed vault?
Budget cuts leave it looking pretty empty.`);
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

    // door
    GenerateClickZone(room, 39, 70, 82, 107, clickedBy => {
        if(clickedBy == null) {
            room.showMessageBox(`The door is utterly locked.`);
        }
    });

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
