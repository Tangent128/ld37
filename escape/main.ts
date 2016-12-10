/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />

class GuiRoom extends ECS.Room {
    private renderer = new Render.RenderList();

    public RoomLayer = new Render.Layer(1, 0);

    private DebugRenderSystem = new RenderDebug.System(this.renderer);

    runPhysics() {

    };
    runRender(cx: CanvasRenderingContext2D) {
        cx.fillStyle = "red";
        cx.fillRect(0,0, 400,300);

        this.renderer.reset();

        this.DebugRenderSystem.run(this.Entities);

        this.renderer.drawTo(cx);
    };

    addBox(location: ECS.Location) {
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
            )
        };

        this.Entities.push(entity);
    };
};

@Applet.Bind("canvas")
class EscapeMain {

    private room = new GuiRoom(20);

    private loop: ECS.Loop;

    constructor(private element: HTMLCanvasElement) {

        let cx = element.getContext("2d");

        // init entities
        this.resetGame();

        // init mouse system
        new Mouse.MouseControl(this.element, this.room);

        // start loop
        this.loop = new ECS.Loop(this.room, cx);
        this.loop.start();
    };

    resetGame() {
        this.room.Entities.length = 0;

        this.room.addBox(new ECS.Location(0,0));
        this.room.addBox(new ECS.Location(150,150));
        this.room.addBox(new ECS.Location(300,70));
        this.room.addBox(new ECS.Location(200,250));
    };

};
