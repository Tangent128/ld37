/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />
/// <reference path="./pin.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./textbox.ts" />

enum InventoryItemType {
    Shovel,
    Screwdriver,
    Lead,
    Gold,
    Seed
};
class InventoryItem {

    public List: InventoryItemType[] = null;

    constructor(
        public Type: InventoryItemType
    ) { };

    remove() {
        if (this.List) {
            let index = this.List.indexOf(this.Type);
            if (index >= 0) {
                this.List.splice(index, 1);
            }
        }
        let oldList = this.List;
        this.List = null;
        return oldList;
    };
    addTo(list: InventoryItemType[]) {
        this.remove();
        this.List = list;
        list.push(this.Type);
    };
};
interface HasInventoryItem {
    InventoryItem: InventoryItem
};
function HasInventoryItem(entity: any): entity is HasInventoryItem {
    return entity.InventoryItem != null;
};


class GuiRoom<State> extends ECS.Room {
    private renderer = new Render.RenderList();

    public DropLayer = new Render.Layer(0, 0);
    public RoomLayer = new Render.Layer(1, 0);
    public ObjectLayer = new Render.Layer(2, 0);
    public TextboxLayer = new Render.Layer(3, 0);
    public CursorLayer = new Render.Layer(10, 0);

    private SlideSystem = new Slide.SlideSystem();
    private PinSystem = new Pin.PinSystem();

    private DebugRenderSystem = new RenderDebug.System(this.renderer);
    private TextRenderSystem = new Textbox.RenderTextSystem(this.renderer);

    constructor(
        fps: number,
        public State: State
    ) {
        super(fps);
    };

    runPhysics() {
        this.SlideSystem.run(this.Entities);
        this.PinSystem.run(this.Entities);
        this.cleanup();
    };
    runRender(cx: CanvasRenderingContext2D) {
        cx.fillStyle = "red";
        cx.fillRect(0, 0, 500, 300);

        this.renderer.reset();

        this.DebugRenderSystem.run(this.Entities);
        this.TextRenderSystem.run(this.Entities);

        this.renderer.drawTo(cx);
    };

    showMessageBox(message: string) {
        Textbox.MessageBox(this.Entities, this.TextboxLayer, message);
    };

    makeDummyObject(color: string, x: number, y: number, label: string) {
        let bounds = new Render.Box(-16, -16, 32, 32);
        let entity = {
            Location: new ECS.Location(x, y),
            RenderDebugBox: new RenderDebug.Box(
                this.RoomLayer,
                bounds,
                color
            ),
            RenderText: new Textbox.Text(this.RoomLayer, label)
        };

        this.onClick(entity, clickedWith => {
            if (clickedWith == null && HasInventoryItem(entity)) {
                entity.RenderDebugBox.Layer = this.CursorLayer;
                entity.RenderText.Layer = this.CursorLayer;
                entity.InventoryItem.remove();
                Mouse.MakeCursor(entity);
            }
        });

        this.Entities.push(entity);
        return entity as (
            ECS.Entity
            & ECS.HasLocation
            & RenderDebug.HasBox
            & Textbox.HasText
            & Mouse.HasTarget
        );
    };

    onClick(entity: RenderDebug.HasBox, callback: (clicked: Mouse.IsCursor) => void) {

        if(Mouse.HasTarget(entity)) {
            entity.ClickTarget.callback = callback;
        } else {
            (entity as any).ClickTarget = new Mouse.ClickTarget(
                Mouse.UiLayer.Room,
                entity.RenderDebugBox.bounds,
                callback
            );
        }

    };

    assignInventoryItem(
        entity: any,
        type: InventoryItemType,
        existingList: InventoryItemType[] = null
    ) {
        if(HasInventoryItem(entity)) {
            let list = entity.InventoryItem.remove();
            entity.InventoryItem.Type = type;
            if(existingList || list) {
                entity.InventoryItem.addTo(existingList || list);
            }
        } else {
            let inventoryItem = new InventoryItem(type);
            inventoryItem.List = existingList;
            entity.InventoryItem = inventoryItem;
        }
    };

    makeInventoryDropper(
        bounds: Render.Box,
        list: InventoryItemType[],
        clickLayer: Mouse.UiLayer = Mouse.UiLayer.Room
    ) {
        let entity = {
            RenderDebugBox: new RenderDebug.Box(
                this.DropLayer,
                bounds,
                "#999"
            ),
            ClickTarget: new Mouse.ClickTarget(
                clickLayer,
                bounds,
                clickedWith => {
                    if (clickedWith != null && HasInventoryItem(clickedWith)) {
                        if (RenderDebug.HasBox(clickedWith)) {
                            clickedWith.RenderDebugBox.Layer = this.RoomLayer;
                        }
                        if (Textbox.HasText(clickedWith)) {
                            clickedWith.RenderText.Layer = this.RoomLayer;
                        }
                        if(Mouse.HasTarget(clickedWith)) {
                            clickedWith.ClickTarget.layer = clickLayer;
                        }
                        clickedWith.InventoryItem.addTo(list);
                        Mouse.CancelCursor(clickedWith);
                    }
                }
            )
        };

        this.Entities.push(entity);
        return entity;
    };
};
