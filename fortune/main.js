// @ts-check
// Direction: bottom-up

/**
 * @typedef {object} Coordinate
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef {object} SiteEvent
 * @property {Coordinate} point
 */
/**
 * @typedef {object} VertexEvent
 * @property {ParabolaArc[]} arcs
 * @property {Coordinate} eventPoint
 * @property {Coordinate} vertexPoint
 */
/**
 * @typedef {object} EventResult
 * @property {boolean} isSiteEvent
 * @property {SiteEvent | VertexEvent} event
 */
/**
 * @typedef {object} ActiveSite
 * @property {Coordinate} site
 * @property {ParabolaArc[]} arcs
 */
/**
 * @typedef {object} ParabolaArc
 * @property {ActiveSite} activeSite
 * @property {ParabolaArc} rightArc
 * @property {ParabolaArc} leftArc
 */
/**
 * @typedef {object} CircleResult
 * @property {Coordinate} centre
 * @property {number} radius
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

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {Coordinate} c
 * @returns {CircleResult}
 */
function circle(a, b, c) {
    const ax2 = a.x * a.x
    const bx2 = b.x * b.x
    const cx2 = c.x * c.x
    const ay2 = a.y * a.y
    const by2 = b.y * b.y
    const cy2 = c.y * c.y

    const centreX = (((c.y - a.y) * (bx2 - ax2 + by2 - ay2)) - ((b.y - a.y) * (cx2 - ax2 + cy2 - ay2))) /
        (2 * ((b.x - a.x) * (c.y - a.y) + (c.x - a.x) * (b.y - a.y)))
    const centreY = (ax2 - bx2 + ay2 - by2 + 2 * centreX * (b.x - a.x)) / (2 * (a.y - b.y))
    const radius = Math.sqrt((a.x - centreX) * (a.x - centreX) + (a.y - centreY) * (a.y - centreY))
    console.log(radius)
    console.log(Math.sqrt((b.x - centreX) * (b.x - centreX) + (b.y - centreY) * (b.y - centreY)))
    console.log(Math.sqrt((c.x - centreX) * (c.x - centreX) + (c.y - centreY) * (c.y - centreY)))
    return { centre: { x: centreX, y: centreY }, radius: radius }
}

function PriorityQueue() {
    /**@type {SiteEvent[]} */
    this.siteEvents = []
    /**@type {VertexEvent[]} */
    this.vertexEvents = []
}

/**
 * @param {Coordinate[]} values
 */
PriorityQueue.prototype.pushSiteEvents = function(values) {
    /**@type {SiteEvent[]} */
    this.siteEvents = values.map(function(element) { return { point: element } })
    this.sortSites()
}

/**
 * @param {VertexEvent[]} values
 */
PriorityQueue.prototype.pushVertexEvents = function(values) {
    this.vertexEvents = values
    this.sortVertices()
}

/**
 * @param {VertexEvent[]} values
 */
PriorityQueue.prototype.removeVertexEvents = function(values) {
    this.vertexEvents = this.vertexEvents.filter(function(element) { values.indexOf(element) > -1 })
    this.sortVertices()
}

/**
 * @returns {boolean}
 */
PriorityQueue.prototype.isEmpty = function() { return this.siteEvents.length == 0 }

PriorityQueue.prototype.sortSites = function() {
    // sort in descending order as last element is what's popped
    this.siteEvents.sort(function(a, b) {
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

PriorityQueue.prototype.sortVertices = function() {
    // sort in descending order as last element is what's popped
    this.vertexEvents.sort(function(a, b) {
        if (a.eventPoint.y == b.eventPoint.y) {
            return 0
        }
        else if (a.eventPoint.y > b.eventPoint.y) {
            return -1
        }
        else {
            return 1
        }
    })
}

/**
 * @returns {EventResult}
 */
PriorityQueue.prototype.pop = function() {
    if (this.siteEvents.length == 0) {
        return { isSiteEvent: true, event: this.siteEvents.pop() }
    }
    if (this.vertexEvents.length == 0) {
        return { isSiteEvent: false, event: this.vertexEvents.pop() }
    }

    const nextSiteEvent = this.siteEvents.pop()
    const nextVertexEvent = this.vertexEvents.pop()
    if (nextSiteEvent.point.y < nextVertexEvent.eventPoint.y) {
        this.vertexEvents.push(nextVertexEvent)
        return { isSiteEvent: true, event: nextSiteEvent }
    }
    else {
        this.siteEvents.push(nextSiteEvent)
        return { isSiteEvent: false, event: nextVertexEvent }
    }
}


function VoronoiDiagram() {
    /**@type {Coordinate[]} */
    this.vertices = []
    /**@type {ActiveSite[]} */
    this.activeSites = []
    this.lineSweepPosition = 0
    this.queue = new PriorityQueue()
}

/**
 * @param {Coordinate[]} sites
 */
VoronoiDiagram.prototype.compute =  function(sites) {
    this.queue.pushSiteEvents(sites)

    while (!this.queue.isEmpty()) {
    }
}

/**
 * @param {Coordinate} site
 * @returns {ActiveSite}
 */
VoronoiDiagram.prototype.insertSite = function(site) {
    const self = this
    let closestParabolaYDistance = Infinity;
    /**@type {ActiveSite} */
    let closestParabolaSite = null;
    let closestParabolaIndex = 0
    this.activeSites.forEach(function(element, index) {
        let yDist = parabolaPoint(element.site, self.lineSweepPosition, site.x).y
        if (yDist < closestParabolaYDistance) {
            closestParabolaYDistance = yDist
            closestParabolaSite = element
            closestParabolaIndex = index
        }
    })

    /**@type {ParabolaArc} */
    let containingArc = null
    let containingArcIndex = 0
    if (closestParabolaSite.arcs.length == 1) {
        containingArc = closestParabolaSite.arcs[0]
        containingArcIndex = 0
    }
    else {
        // If there's more than one arc on the parabola then there's another parabola subdividing it and checking the position of the related site point
        // should indicate which arc the new site falls on
        closestParabolaSite.arcs.forEach(function(arc, index) {
            if (arc.rightArc.activeSite.site.x > site.x) {
                containingArc = arc.rightArc
                containingArcIndex = index
                return
            }
        })
        // If the end is reached without the containing arc found then it must be the last arc
        // of the parabola, with its right neighbour being the parabola that this parabola subdivides
        containingArcIndex = closestParabolaSite.arcs.length - 1
        containingArc = closestParabolaSite.arcs[containingArcIndex]
    }

    // Split containing arc and insert new arc between them
    /**@type {ParabolaArc} */
    let splitArc = { activeSite: closestParabolaSite, rightArc: containingArc.rightArc, leftArc: null }
    /**@type {ParabolaArc} */
    let insertedArc = { activeSite: null, rightArc: splitArc, leftArc: null }
    containingArc.rightArc = insertedArc
    insertedArc.leftArc = containingArc
    splitArc.leftArc = insertedArc

    /**@type {ActiveSite} */
    let insertedSite = { site: site, arcs: [insertedArc] }
    insertedArc.activeSite = insertedSite
    this.activeSites.push(insertedSite)
    return insertedSite
}

/**
 * @param {ActiveSite} site
 */
VoronoiDiagram.prototype.updateVertexEvents = function(site) {
    const arc = site.arcs[0]
    /**@type {VertexEvent[]} */
    const brokenVertexEvents = []
    this.queue.vertexEvents.forEach(function(event) {
        if (event.arcs[0].rightArc == arc || event.arcs[1].rightArc == arc) {
            brokenVertexEvents.push(event)
        }
    })
    this.queue.removeVertexEvents(brokenVertexEvents)
    const possibleTriples = [
        [arc.activeSite, arc.rightArc.activeSite, arc.rightArc.rightArc.activeSite],
        [arc.leftArc.activeSite, arc.activeSite, arc.rightArc.activeSite],
        [arc.leftArc.leftArc.activeSite, arc.leftArc.activeSite, arc.activeSite]
    ]
    const validTriples = possibleTriples.filter(function(triple) {
        return triple[0] != triple[1] && triple[0] != triple[2] && triple[1] != triple[2]
    })
}

console.log(circle(
    { x:  4.35, y:  9.00 },
    { x: -9.95, y:  1.00 },
    { x: -5.00, y: -8.66 }
))