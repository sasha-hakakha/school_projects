//
// cycle.js
//
// Author: Jim Fix
// CSCI 385, Reed College, Spring 2022
//
// This defines a class for representing a Tron cycle that drives on a
// oriented surface made up of triangular facets. It sets up a collection
// of cycles (currently only one) that are used by the main app.
//
// ========
//


//
// The fixed collection of colors for cycles.
//
const gCycleColors = [{r:0.75, g:0.25, b:0.55},
                      {r:0.90,g:0.30, b:0.10},
                      {r:0.60, g:0.57, b:0.52},
                      {r:0.02, g:0.02, b:0.23},
                      {r:0.45, g:0.18, b:0.76}];

//
// Constants for updating a cycle's position.
//
const INITIAL_SPEED         = 0.02; // Cross a face in 50 frames.
const SPEED_UPDATE          = 0.02;
const MAX_SPEED             = 0.70;  // Cross seven faces every 10 frames.
const MIN_SPEED             = INITIAL_SPEED;

//
// Tweaks that make the cylist's driving perspective better.
//
const UPDOWN_ADJUST  = 0.15;
const LOOKING_ADJUST = 30;
const FOCAL_RATIO    = 1.8;

//
// Constants for steering the player's cycle.
//
const PLAYER_STEER_LEFT     = 0;
const PLAYER_STEER_STRAIGHT = 1;
const PLAYER_STEER_RIGHT    = 2;

//
// Setting up the global set of cycles and initializing them.
//
let gPlayer = null;
let gCycles = [];

function initCycles() {
    gPlayer = new Cycle(gSurface, 0);
    gOther = new autoCycle(gSurface, 1, 1);
    gOther2 = new autoCycle(gSurface, 2, 3);
    gOther3 = new autoCycle(gSurface, 3, 5);
    gOther4 = new autoCycle(gSurface, 4, 7);
    gCycles = [gPlayer, gOther, gOther2, gOther3, gOther4];
}


//
// class Cycle
//
// Object representing a cycle that drives around on a surface. This
// can be modified, refactored, and/or subclassed to extend the
// gameplay of the app, to include behavior of other cycles.
//
// A cycle is constructed on a surface, with a certain color (an index
// into `gCycleColors` described at the top of this file), and with an
// index of the starting face where it should get placed.
//
// Since the app allows the user to switch surfaces, any existing cycle
// needs to be `resetOn` that newly selected surface.
//
// In addition, there are methods to `update` the position of the cycle
// according to `setSteering` state to have the cycle turn left or right
// on the surface.
//
// Currently, this class is designed more specifically to support basic
// navidation of the cycle game "player" used by the starter version of
// the app.
//
class Cycle {

    constructor(surface, colorIndex, faceid = 0) {
        //
        // Construct a new cycle of the specified color, on a surface.
        // Relies heavily on `resetOn`.
        //

        this.color = gCycleColors[colorIndex];
        this.resetOn(surface, faceid);
        this.colorid = colorIndex;
    }

    resetOn(surface, faceid = 0) {
        //
        // Place the cycle on a new surface at the specified face/edge.
        // Reset its navigation status.
        //

        this.surface    = gSurface;
        this.faceid     = faceid;
        this.face       = this.surface.getFace(faceid * Math.floor((Math.random() * surface.faces.length) + 1) % surface.faces.length); //place cycles randomly at beginning
        this.edge       = this.face.edge;
        this.nextEdge   = this.edge.prev.twin;
        this.speed      = INITIAL_SPEED;
        this.between    = 0.0;
        this.moving     = false;
        this.steer      = PLAYER_STEER_STRAIGHT;
        this.steerState = -1;
        this.alive = true;
    }

    // * * * * * * * * * * * * * * * *
    //
    // SUPPORT FOR DRIVING
    //

    update() {
        //
        // Updates the position of the cycle on a face, possibly advancing
        // it to the next surface face.
        //
        if (this.moving) {
            this.between += this.speed;
            if (this.between > 1.0) {
                this.between -= 1.0;    // Note that this.speed shouldn't be > 1.0;
                this.advanceEdgeFace();
            }
        }
    }

    setSteering(steer) {
        //
        // Register a left/right turn to be made when we hit the next
        // face.
        //

        this.steer = steer;
    }

    speedUp() {
        //
        // Increase the cycle's speed.
        //

        this.speed += SPEED_UPDATE;
        if (this.speed > MAX_SPEED) {
            this.speed = MAX_SPEED;
        }
    }

    slowDown() {
        //
        // Decrease the cycle's speed.
        //

        this.speed -= SPEED_UPDATE;
        if (this.speed < MIN_SPEED) {
            this.speed = MIN_SPEED;
        }
    }

    pauseResume() {
        //
        // Start/stop the cycle's movement.
        //

        this.moving = !this.moving;
    }

    advanceEdgeFace() {
        //
        // Advance the cycle from one face to another. It does so by
        // updating the entering and exiting edges, based on which face
        // it moves to next (`this.edge` and `this.nextEdge`).
        //
        // The face is advanced by moving to the left or right
        // neighboring face of the face being exited, using `this.steer`
        // and (maybe) `this.flip`.
        //

        this.edge = this.nextEdge;
        this.face = this.edge.face;
        if(this.face.crossed != -1 && this.face.crossed != this.colorid) {
          this.alive = false;
        }
        let dir   = this.steer;

        //
        // If "heading straight", we alternate left/right turns so that
        // we drive along a triangle strip.
        //
        if (dir == PLAYER_STEER_STRAIGHT) {
            dir = dir + this.steerState;
            this.steerState *= -1;
        }

        //
        // Move to the left face to exit this face.
        //
        if (dir == PLAYER_STEER_LEFT) {
            this.nextEdge = this.edge.prev.twin;
        }
        //
        // Or maybe move to the right face to exit this face.
        //
        if (dir == PLAYER_STEER_RIGHT) {
            this.nextEdge = this.edge.next.twin;
        }

        //
        // De-register the last registered turn, move straight next.
        //
        this.steer = PLAYER_STEER_STRAIGHT;

        //
        // Alter the color of the face we've just entered.
        //
        this.surface.paint(this.face, this.color);
        this.face.crossed = this.colorid;
    }



    // * * * * * * * * * * * * * * * *
    //
    // SUPPORT FOR RENDERING
    //

    draw() {
        //
        // Use OpenGL/WebGL calls to place the cycle mid-way somewhere on
        // the face where it sits. Relies heavily on the `Surface` data
        // structure, interpreting `this.between`.
        //

        glPushMatrix();

        //
        // Figure out a line segment along the current face, and place the
        // cycle part-way on it according to `this.between`.
        //
        const face = this.face;
        const edge = this.edge;
        const next = this.nextEdge;
        const pFrom = edge.source.position.combo(0.5,edge.target.position);
        const pTo   = next.source.position.combo(0.5,next.target.position);
        const vFwd  = pTo.minus(pFrom);
        const pMid  = pFrom.combo(this.between,pTo);
        const vUp   = face.getNormal();
        const p     = pMid.plus(vUp.times(0.05));

        // Use that info to place/direct/orient the object.
        gluTargetTo(p, p.plus(vFwd), vUp);

        // Set the color.
        glColor3f(this.color.r, this.color.g, this.color.b);

        // Compute a size of the bike, relative to speed. Here's a hack!
        const scale = 0.1*Math.sqrt((this.speed+0.5)/0.5);

        // Place the front wheel at the location, resize (with flip).
        glScalef(scale, scale, -scale);
        glTranslatef(0.0,-0.1,-0.5); // Move back and down a little.

        // Draw it!
        glBeginEnd("tron-cycle");

        glPopMatrix();
    }

    setPerspective() {
        //
        // Use OpenGL/WebGL calls to place the camera from this
        // cycle's perspective.
        //
        // The camera is placed mid-way along a line segment on the
        // the face where the cycle sits, but sitting a little above
        // the surface. It shoots along this segment, oriented so that
        // its frame's up direction is along the normal of the surface.
        //
        // This code relies heavily on the `Surface` data structure,
        // interpreting `this.between` to put the camera along the
        // face.
        //

        glTranslatef(0.0,UPDOWN_ADJUST,0.0);
        const face = this.face;
        const edge = this.edge;
        const next = this.nextEdge;
        const pFrom = edge.source.position.combo(0.5,edge.target.position);
        const pTo   = next.source.position.combo(0.5,next.target.position);
        const vFwd  = pTo.minus(pFrom);
        const pMid  = pFrom.combo(this.between,pTo);
        const vUp   = face.getNormal();
        const e = pMid.plus(vUp.times(0.05));
        //
        glRotatef(LOOKING_ADJUST, 1.0, 0.0, 0.0);
        gluPerspective(Math.PI/FOCAL_RATIO, 1.0,  100, 0.1);
        gluLookAt(e, e.plus(vFwd), vUp); // Look ahead, down to
                                         // the next position on
                                         // the surface.
    }
  }


//subclass of the cycle class for automatically driving cycles

    class autoCycle extends Cycle {

          advanceEdgeFace() {
              //
              // Advance the cycle from one face to another. It does so by
              // updating the entering and exiting edges, based on which face
              // it moves to next (`this.edge` and `this.nextEdge`).
              //
              // The face is advanced by moving to the left or right
              // neighboring face of the face being exited, using `this.steer`
              // and (maybe) `this.flip`.
              //

              let rand = Math.floor((Math.random() * 25) + 1); //random number for turning 

              this.edge = this.nextEdge;
              this.face = this.edge.face;
              if(this.face.crossed != -1 && this.face.crossed != this.colorid) {
                this.alive = false;
              }
              let dir   = this.steer;

              //
              // If "heading straight", we alternate left/right turns so that
              // we drive along a triangle strip.
              //
              if (dir == PLAYER_STEER_STRAIGHT) {
                  dir = dir + this.steerState;
                  this.steerState *= -1;
              }

              if(rand == 1) {
                  dir = PLAYER_STEER_LEFT;
                }

              if(rand == 2) {
                  dir = PLAYER_STEER_RIGHT;
              }


              if(dir == PLAYER_STEER_LEFT) {
                this.nextEdge = this.edge.prev.twin;
              }

              if(dir == PLAYER_STEER_RIGHT) {
                this.nextEdge = this.edge.next.twin;
              }


              //
              // De-register the last registered turn, move straight next.
              //
              this.steer = PLAYER_STEER_STRAIGHT;

              //
              // Alter the color of the face we've just entered.
              //
              this.surface.paint(this.face, this.color);
              this.face.crossed = this.colorid;
          }

            update() {
                //
                // Updates the position of the cycle on a face, possibly advancing
                // it to the next surface face.
                //
                if (this.moving) {
                    this.between += this.speed;
                    if (this.between > 1.0) {
                        this.between -= 1.0;    // Note that this.speed shouldn't be > 1.0;
                        this.advanceEdgeFace();
                    }
                }
            }
    }
