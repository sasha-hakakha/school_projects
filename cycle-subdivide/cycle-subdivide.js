//
// cycle-subdivide.js
//
// Author: Jim Fix
// CSCI 385: Computer Graphics, Reed College, Spring 2022
//
// This, as it stands, is a WebGL program that displays the surfaces
// described in several Wavefront .OBJ file, made up of triangular
// facets. The surface's mesh components--- the vertices, edges, and
// faces-- are described as a "winged half-edge" data structure. This
// gives us a means for exploring these components' topological
// relationships with each other. It provides an oriented
// representation that makes the connectivity amongst the components
// navigable.
//
// The program provides two views of the surface:
//
// * A whole-object view that displays the entire surface from a
//   distance.  The object can be reoriented in this diplay by
//   dragging it within that portion of the GL canvas.
//
// * An on-surface view from the perspective of someone sitting on
//   some facet of the surface. This starts with a view of a Tron
//   cycle, placed on face #0 of the surface. The Tron cycle can be
//   made to drive around on the surface, and so this view shows gives
//   the perspective of that driver.
//
// The Tron cycle's movement showcases the traversal made possible by
// the oriented surface representation of the mesh data structure.
//
// The drawing part of the code occurs in `drawViews` and relies
// heavily on the `opengl.js` library. The surface is represented in
// the file `surface.js`. This includes code that "compiles" the
// surface (using `glBegin/glEnd`) so that it can be displayed both
// with shading and as a wireframe mesh.
//
// ========
//
// the primary ASSIGNMENT
//
// To complete the assignment, your assignment is to modify the code
// in `surface.js` so that it subdivides a surface. You write the
// method `subdivide` in `class Surface` so that it returns a new
// surface object, from a given one. It should do so using the Loop
// subdivision scheme we described in lecture.
//
// The code below runs a Tron cycle game where the protaganist can
// drive a cyle across the selected surface. The movement of the cycle
// is controlled by kepresses `ijkl`. As the cycle moves across the
// surface, its color is painted on the facets of the surface, and
// so it leaves a trail behind it.
//
// This is a good way to verify that your subdivision step preserves
// the surface's topology.
//
// ========
//
// an additional ENHANCEMENT
//
// Furthermore, the assignment description asks that you showcase the
// surface data structure by enhancing the app. It gives several
// suggestions for doing so.
//
// For example, you could modify the code below to introduce several
// enemy cycles that drive across the surface, each a different color,
// painting their own trail, and each controlled by some AI.
//
// You could then add win/lose conditions to the game. Cycles crash
// when they hit the trail of another cyclist. If the player survives
// and all the others crash, then the player WINS!
//
// ========

//
let gSurfaces       = new Map();
let gSurfaceLibrary = new Map();
let gSurfaceChoice  = "bunny";
let gSurface        = null;
//
let gWidth = 1280;
let gHeight = 640;
//
let gOrientation = quatClass.for_rotation(0.00, new Vector3d(1.0,0.0,0.0));
let gMouseStart  = {x: 0.0, y: 0.0};
//
let gLightOn       = true;
let gLightPosition = new Point3d(-1.5, 0.875, -1.0);
//
let gShowMesh      = true;
//

function pauseResumeGame() {
    for (let cycle of gCycles) {
        cycle.pauseResume();
    }
}

function chooseSurface(objname) {
    gSurfaceChoice = objname;
    gSurface =  gSurfaces.get(gSurfaceChoice);
    for (let cycle of gCycles) {
        cycle.resetOn(gSurface, cycle.faceid);
    }
}

function loadObjects() {

    // Load the Tron cycle .OBJ description.
    //
    const cycleText = document.getElementById("tron-cycle.obj").text;
    gSurfaceLibrary.set("tron-cycle",cycleText);

    // Load each of the surface options as .OBJ files for the radio buttons.
    //
    const rbs = document.querySelectorAll('input[name="surface"]');
    for (const rb of rbs) {
        //
        const objName = rb.value;
        const objFileName = objName + ".obj";
        const objFileText = document.getElementById(objFileName).text;
        gSurfaceLibrary.set(objName,objFileText);
        //
        rb.addEventListener("click", () => {
            chooseSurface(rb.value);
        });
    }
}


function makeObject(objname, objtext) {
    /*
     * Processes the Wavefront .OBJ file information stored in
     * the string `objtext`. It builds a `Surface` instance for
     * it. It then creates two `glBeginEnd` renderings:
     *
     *  "object": is the triangular facets of the object,
     *            using a surface material that is a mix of
     *            the ground color, and the cycle trails'
     *            colors.
     *
     *  "object-mesh": description of all the edges of the
     *                 faceted object.
     *
     * In the above, "object" stands in for `objname`.
     *
     */

    const surface = new Surface(objname);
    surface.read(objtext);

    if (objname != "tron-cycle") {
        //
        // Make faceted object.
        surface.glCompile() // a series of trios of glVertex3f

        //
        // Make the wireframe.
        surface.glCompileMesh() // a series of pairs of glVertex3f

    } else {
        //
        // Little hack for the player/cycle.
        surface.glCompile(false)
    }



    //
    // Include amongst surfaces.
    gSurfaces.set(objname,surface);
}

function drawObject() {
    /*
     * Renders the object within the WebGL/UT context.
     *
     * Uses Phong shading (set by GL_LIGHTING) illuminated by a
     * single light, GL_LIGHT0.
     *
     */

    // Turn on lighting.
    glEnable(GL_LIGHTING);
    if (gLightOn) {
	    glEnable(GL_LIGHT0);
    }
    glLightfv(GL_LIGHT0, GL_POSITION, gLightPosition.components());

    // Render the object in the selected style.
    gSurface.glRender();

    glDisable(GL_LIGHT0);
    glDisable(GL_LIGHTING);
}

function makeDriverDisplay() {
    //
    // Describe an arrow in the top left corner of the view square.
    glBegin(GL_TRIANGLES, "left-arrow", true);
    glColor3f(0.4,0.7,0.2);
    glVertex3f(-0.9,0.6,1.0);
    glVertex3f(-0.6,0.3,1.0);
    glVertex3f(-0.6,0.9,1.0);
    glEnd();
    //
    //
    // Describe an arrow in the top right corner of the view square.
    glBegin(GL_TRIANGLES, "right-arrow", true);
    glColor3f(0.2,0.4,0.7);
    glVertex3f(0.9,0.6,1.0);
    glVertex3f(0.6,0.3,1.0);
    glVertex3f(0.6,0.9,1.0);
    glEnd();
    //
    // Describe goggles.
    //
    glBegin(GL_TRIANGLES, "frame");
    glVertex3f(-1.0,1.0,1.0);
    glVertex3f(-0.75,-0.9,1.0);
    glVertex3f(-1.0,-1.0,1.0);
    //
    glVertex3f(-1.0,-1.0,1.0);
    glVertex3f(-0.75,-0.9,1.0);
    glVertex3f(0.0,-0.85,1.0);
    //
    glVertex3f(-1.0,-1.0,1.0);
    glVertex3f(0.0,-0.85,1.0);
    glVertex3f(0.0,-1.0,1.0);
    //
    glVertex3f(1.0,1.0,1.0);
    glVertex3f(0.75,-0.9,1.0);
    glVertex3f(1.0,-1.0,1.0);
    //
    glVertex3f(1.0,-1.0,1.0);
    glVertex3f(0.75,-0.9,1.0);
    glVertex3f(0.0,-0.85,1.0);
    //
    glVertex3f(1.0,-1.0,1.0);
    glVertex3f(0.0,-0.85,1.0);
    glVertex3f(0.0,-1.0,1.0);
    glEnd();
}

function drawWireframe() {
    /*
     * Renders a wireframe mesh of the object within the WebGL/UT context.
     *
     */
    glColor3f(0.95,0.9,0.5);
    gSurface.glRenderMesh();
}

function drawCycles() {

    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0);
    for (let cycle of gCycles) {
      if(cycle.alive) {
        cycle.draw();
      }
    }
    glDisable(GL_LIGHTING);
    glDisable(GL_LIGHT0);
}

function drawObjectView() {

    // Clear the transformation stack.
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    // Draw the object and the cycles.
    //
    glPushMatrix();
    {

        // Sit back a little from the object, fit it with some margin.
        //
        glTranslatef(-1.0,0.0,0.0);
        glScalef(0.9,0.9,0.9);

	    // Transform by the current trackball oriention.
        //
	    gOrientation.glRotatef();

        // Render the surface.
	    drawObject();
	    if (gShowMesh) {
	        drawWireframe();
	    }

        // Render the cycles.
        drawCycles();
    }
    //
    glPopMatrix();
}

function drawSurfaceView() {

    // Clear the transformation stack.
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    // Center on the right side.
    glTranslatef(1.0,0.0,0.0);

    {
        // Show the direction arrows.
        //
        if (gPlayer.steer == PLAYER_STEER_LEFT) {
            glBeginEnd("left-arrow");
        }
        //
        if (gPlayer.steer == PLAYER_STEER_RIGHT) {
            glBeginEnd("right-arrow");
        }
        glColor3f(gPlayer.speed+0.3,gPlayer.speed/3+0.3,0.1);
        glBeginEnd("frame");
    }

    // Draw the object's surface from the player's perspective.
    {
        glPushMatrix();

        //
        gPlayer.setPerspective();

        //
	    drawObject();
	    if (gShowMesh) {
	        drawWireframe();
	    }

        glPopMatrix();
    }
}

function drawViews() {
    /*
     * Issue GL calls to draw the scene.
     */

    // Clear the rendering information.
    glClearColor(0.2,0.2,0.3);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glEnable(GL_DEPTH_TEST);

    // Draw the full-object view on the left.
    glEnable(GL_SCISSOR_TEST);
    glScissor(0, 0, gWidth - gHeight, gHeight);
    drawObjectView();
    glDisable(GL_SCISSOR_TEST);

    // Draw the on-surface view on the right.
    glEnable(GL_SCISSOR_TEST);
    glScissor(gHeight, 0, gHeight, gHeight);
    drawSurfaceView();
    glDisable(GL_SCISSOR_TEST);

    // Render everything.
    glFlush();
}


function handleKey(key, x, y) {
    /*
     * Handle a keypress.
     */

    //
    // Refine the surface with a subdivision step.
    if (key == "p") {
        const refinement = gSurface.subdivide();
        gSurfaces.delete(gSurfaceChoice);
        gSurfaces.set(gSurfaceChoice,refinement);
        chooseSurface(gSurfaceChoice);
        refinement.glCompile();
        refinement.glCompileMesh();
    }

    //
    // Turn wireframe on/off.
    if (key == "w") {
	    gShowMesh = !gShowMesh;
    }

    //
    // Steer by registering the next forward face as left/right/alternating.
    if (key == 'j') {
        // Next traveled face should be the forward-left face.
        gPlayer.setSteering(PLAYER_STEER_LEFT);
    }
    if (key == 'l') {
        // Next traveled face should be the forward-right face.
        gPlayer.setSteering(PLAYER_STEER_RIGHT);
    }
    if (key == 'k') {
        // Slow down.
        gPlayer.slowDown();
    }
    if (key == 'i') {
        // Speed up.
        gPlayer.speedUp();
    }

    //speedup non-player cycles
    if (key == 'a') {
        // Speed up.
        for(let i= 1; i < gCycles.length; i++) {
          gCycles[i].speedUp();
        }
    }

    //
    if (key == ' ') {
        pauseResumeGame();
    }

    //
    glutPostRedisplay();
}

function worldCoords(mousex, mousey) {
    const pj = mat4.create();
    glGetFloatv(GL_PROJECTION_MATRIX,pj);
    const pj_inv = mat4.create();
    mat4.invert(pj_inv,pj);
    const vp = [0,0,0,0];
    glGetIntegerv(GL_VIEWPORT,vp);
    const mousecoords = vec4.fromValues(2.0*mousex/vp[2]-1.0,
					                    1.0-2.0*mousey/vp[3],
					                    0.0, 1.0);
    vec4.transformMat4(location,mousecoords,pj_inv);
    return {x:location[0], y:location[1]};
}

function handleMouseClick(button, state, x, y) {
    /*
     * Records the location of a mouse click in object world coordinates.
     */

    // Start tracking mouse for trackball/light motion.
    mouseStart  = worldCoords(x,y);
    mouseButton = button;
    if (state == GLUT_DOWN) {
	    mouseDrag = true;
    } else {
	    mouseDrag = false;
    }
    glutPostRedisplay()
}

function handleMouseMotion(x, y) {
    /*
     * Reorients the object based on the movement of a mouse drag.
     *
     * Uses last and current location of mouse to compute a trackball
     * rotation. This gets stored in the quaternion gOrientation.
     *
     */

    // Capture mouse's position.
    mouseNow = worldCoords(x,y)

    // Update object/light orientation based on movement.
    dx = mouseNow.x - mouseStart.x;
    dy = mouseNow.y - mouseStart.y;
    axis  = (new Vector3d(-dy,dx,0.0)).unit()
    angle = Math.asin(Math.min(Math.sqrt(dx*dx+dy*dy),1.0))
    gOrientation = quatClass.for_rotation(angle,axis).times(gOrientation);

    // Ready state for next mouse move.
    mouseStart = mouseNow;

    // Update window.
    glutPostRedisplay()
}

function resizeWindow(w, h) {
    /*
     * Register a window resize by changing the viewport.
     */
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();

    // Note: We're using a right-handed coordinate system here.
    if (w > h) {
        glOrtho(-w/h, w/h, -1.0, 1.0, -1.0, 1.0);
    } else {
        glOrtho(-1.0, 1.0, -h/w * 1.0, h/w * 1.0, -1.0, 1.0);
    }
}

function handleClockTick(value, msecs) {
    for (let cycle of gCycles) {
      if(cycle.alive) {
      cycle.update();
    }
    }
}

function viewer() {
    /*
     * The main procedure, sets up GL and GLUT.
     */

    // set up GL/UT, its canvas, and other components.
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowPosition(0, 0);
    glutInitWindowSize(gWidth, gHeight);
    glutCreateWindow('CYCLE SUB-DIVIDE!!!!');
    //
    resizeWindow(gWidth, gHeight); // It seems to need this.

    // Make any displayed objects
    makeDriverDisplay();

    // Build the renderable objects.
    loadObjects();
    for (const objname of gSurfaceLibrary.keys()) {
        console.log(objname);
        const objtext = gSurfaceLibrary.get(objname);
        makeObject(objname,objtext);
    }

    // Set up the initial surface.
    chooseSurface(gSurfaceChoice);

    // Place all the game's cycles.
    initCycles();

    // Make a hook for the PLAY button. Starts the game.
    //
    const pb = document.querySelector('#play-button');
    pb.addEventListener("click", () => {
        pauseResumeGame();
    });

    // Register interaction callbacks.
    glutKeyboardFunc(handleKey);
    glutReshapeFunc(resizeWindow);
    glutDisplayFunc(drawViews);
    glutMouseFunc(handleMouseClick);
    glutMotionFunc(handleMouseMotion);
    glutTimerFunc(33,handleClockTick,0);

    // Go!
    glutMainLoop();

    return 0;
}


glRun(() => { viewer(); }, true);
