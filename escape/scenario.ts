/// <reference path="../src/index.ts" />
/// <reference path="./pin.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./textbox.ts" />
/// <reference path="./gui-room.ts" />

function ResetGame(room: GuiRoom) {
    
    room.Entities.length = 0;

    let triggerBox = room.addBox(new ECS.Location(0, 0));
    let slideBox = room.addBox(new ECS.Location(525, 150));
    room.addBox(
        new ECS.Location(300, 70),
        new Textbox.Text(null, "Test Text")
    );
    room.addBox(
        new ECS.Location(200, 250),
        new Textbox.Text(null, "Test\nMultiline\nText")
    );

    triggerBox.ClickTarget.callback = () => {
        Textbox.MessageBox(
            room.Entities,
            room.TextboxLayer,
            "MessageBox Text"
        )
    };

    let slideBehavior = new Slide.SlideBehavior(150, 150);
    (slideBox as any as Slide.HasSlideBehavior).SlideBehavior = slideBehavior;

    slideBox.ClickTarget.callback = clickedWith => {
        if (clickedWith == null) {
            slideBox.RenderDebugBox.Layer = room.CursorLayer;
            Mouse.MakeCursor(slideBox);
        }
    };

    room.addDropTarget(new ECS.Location(200, 200));
    room.addDropTarget(new ECS.Location(300, 120));
};
