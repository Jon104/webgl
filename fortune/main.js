// @ts-check
// Direction: bottom-up

/**
 * @typedef {object} Coordinate
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef {object} SweepEvent
 * @property {Coordinate} point
 * @property {boolean} isVertex
 */
/**
 * @typedef {object} ParabolaArc
 * @property {Coordinate} left
 * @property {Coordinate} right
 */
/**
 * @typedef {object} ActiveSite
 * @property {Coordinate} site
 * @property {ParabolaArc[]} arcs
 */

/**
 * @param {Coordinate} focus
 * @param {number} directrix
 * @param {number} xPos
 * @returns {Coordinate}
 */
function parabolaPoint(focus, directrix, xPos) {
    focus = { x: focus.x, y: focus.y - directrix }
    return {
        x: xPos,
        y: ((((focus.x - xPos) * (focus.x - xPos)) + (focus.y * focus.y)) / (2 * focus.y)) +
            directrix
    }
}

function PriorityQueue() {
    /**@type {SweepEvent[]} */
    this.values = []
    this.sort()
}

/**
 * @param {Coordinate[]} values
 */
PriorityQueue.prototype.pushSiteEvents = function(values) {
    /**@type {SweepEvent[]} */
    this.values = values.map(function(element) { return { point: element, isVertex: false } })
    this.sort()
}

/**
 * @param {Coordinate} value
 */
PriorityQueue.prototype.pushVertexEvent = function(value) {
    this.values.push({ point: value, isVertex: true })
    this.sort()
}

/**
 * @returns {boolean}
 */
PriorityQueue.prototype.isEmpty = function() { return this.values.length == 0 }

PriorityQueue.prototype.sort = function() {
    // sort in reverse order as last element is what's popped
    this.values.sort(function(a, b) {
        if (a.point.y == b.point.y) {
            return 0
        }
        else if (a.point.y > b.point.y) {
            return -1
        }
        else {
            return 1
        }
    })
}

/**
 * @returns {SweepEvent}
 */
PriorityQueue.prototype.pop = function() {
    return this.values.pop()
}


function VoronoiDiagram() {
    /**@type {Coordinate[]} */
    this.vertices = []
    /**@type {ActiveSite[]} */
    this.activeSites = []
    this.lineSweepPosition = 0
}

/**
 * @param {Coordinate[]} sites
 */
VoronoiDiagram.prototype.compute =  function(sites) {
    const queue = new PriorityQueue()
    queue.pushSiteEvents(sites)

    while (!queue.isEmpty()) {
    }
}

/**
 * @param {Coordinate} site
 */
VoronoiDiagram.prototype.insertSite = function(site) {
    /**@type {ActiveSite} */
    let containingSite = null
    /**@type {ParabolaArc} */
    let containingParabola = null
    let containingParabolaIndex = 0
    this.activeSites.forEach(function(activeSite) {
        activeSite.arcs.forEach(function(arc, index) {
            if (arc.left.x < site.x && arc.right.x > site.x) {
                containingParabola = arc
                containingParabolaIndex = index
                return
            }
        })
        if (containingParabola != null) {
            containingSite = activeSite
            return
        }
    })
    let splittingPoint = site.x
    /**@type {ParabolaArc[]} */
    let dividedArcs = [
        {
            left: { x: containingParabola.left.x, y: containingParabola.left.y },
            right: { x: 0, y: 0 }
        },
        {
            left: { x: 0, y: 0 },
            right: { x: 0, y: 0 }
        }
    ]
    // dividedSite.arcs.splice(dividedParabolaIndex, 1,)
}

console.log(parabolaPoint({ x: 5, y: 12 }, 0, -4))