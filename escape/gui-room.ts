class GuiRoom extends ECS.Room {
    private renderer = new Render.RenderList();

    public DropLayer = new Render.Layer(0, 0);
    public RoomLayer = new Render.Layer(1, 0);
    public TextboxLayer = new Render.Layer(3, 0);
    public CursorLayer = new Render.Layer(10, 0);

    private SlideSystem = new Slide.SlideSystem();
    private PinSystem = new Pin.PinSystem();

    private DebugRenderSystem = new RenderDebug.System(this.renderer);
    private TextRenderSystem = new Textbox.RenderTextSystem(this.renderer);

    runPhysics() {
        this.SlideSystem.run(this.Entities);
        this.PinSystem.run(this.Entities);
    };
    runRender(cx: CanvasRenderingContext2D) {
        cx.fillStyle = "red";
        cx.fillRect(0,0, 500,300);

        this.renderer.reset();

        this.DebugRenderSystem.run(this.Entities);
        this.TextRenderSystem.run(this.Entities);

        this.renderer.drawTo(cx);
    };

    addBox(location: ECS.Location, text: Textbox.Text = null) {

        if(text) {
            text.Layer = this.RoomLayer;
        };

        let bounds = new Render.Box(-16, -16, 32, 32);
        let entity = {
            Location: location,
            RenderDebugBox: new RenderDebug.Box(
                this.RoomLayer,
                bounds,
                "#0f0"
            ),
            ClickTarget: new Mouse.ClickTarget(
                Mouse.UiLayer.Room,
                bounds,
                clickedWith => {
                    if(entity.RenderDebugBox.color == "#0f0") {
                        entity.RenderDebugBox.color = "#ff0";
                    } else {
                        entity.RenderDebugBox.color = "#0f0";
                    }
                }
            ),
            RenderText: text
        };

        this.Entities.push(entity);
        return entity;
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
                    if(clickedWith != null) {
                        if(RenderDebug.HasBox(clickedWith)) {
                            clickedWith.RenderDebugBox.Layer = this.RoomLayer;
                            Mouse.CancelCursor(clickedWith);
                        }
                    }
                }
            )
        };

        this.Entities.push(entity);
        return entity;
    };
};
