/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />
/// <reference path="./pin.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./textbox.ts" />

class GuiRoom<State> extends ECS.Room {
    private renderer = new Render.RenderList();

    public DropLayer = new Render.Layer(0, 0);
    public RoomLayer = new Render.Layer(1, 0);
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

    makeDummyObject(color: string, x: number, y: number, label: string)
        : RenderDebug.HasBox & Textbox.HasText {
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
            if (clickedWith == null) {
                entity.RenderDebugBox.Layer = this.CursorLayer;
                entity.RenderText.Layer = this.CursorLayer;
                Mouse.MakeCursor(entity);
            }
        });

        this.Entities.push(entity);
        return entity;
    };

    onClick(entity: RenderDebug.HasBox, callback: (clicked: Mouse.IsCursor) => void) {
        (entity as any).ClickTarget = new Mouse.ClickTarget(
            Mouse.UiLayer.Room,
            entity.RenderDebugBox.bounds,
            callback
        )
    };

    addDropTarget(location: ECS.Location) {
        let bounds = new Render.Box(-64, -12, 128, 24);
        let entity = {
            Location: location,
            RenderDebugBox: new RenderDebug.Box(
                this.DropLayer,
                bounds,
                "#999"
            ),
            ClickTarget: new Mouse.ClickTarget(
                Mouse.UiLayer.Room,
                bounds,
                clickedWith => {
                    if (clickedWith != null) {
                        if (RenderDebug.HasBox(clickedWith)) {
                            clickedWith.RenderDebugBox.Layer = this.RoomLayer;
                        }
                        if (Textbox.HasText(clickedWith)) {
                            clickedWith.RenderText.Layer = this.RoomLayer;
                        }
                        Mouse.CancelCursor(clickedWith);
                    }
                }
            )
        };

        this.Entities.push(entity);
        return entity;
    };
};
