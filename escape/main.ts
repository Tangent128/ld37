/// <reference path="../src/index.ts" />

class GuiRoom extends ECS.Room {
    runPhysics() {

    };
    runRender(cx: CanvasRenderingContext2D) {
        cx.fillStyle = "red";
        cx.fillRect(0,0, 200,100);
    };
};

@Applet.Bind("canvas")
class EscapeMain {

    private room = new GuiRoom(20);

    private loop: ECS.Loop;

    constructor(private element: HTMLCanvasElement) {

        let cx = element.getContext("2d");

        this.loop = new ECS.Loop(this.room, cx);
        this.loop.start();
    };

};
