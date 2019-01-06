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
 * @property {ActiveSite[]} sites
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
    let splitArc = { activeSite: closestParabolaSite, rightArc: containingArc.rightArc }
    /**@type {ParabolaArc} */
    let insertedArc = { activeSite: null, rightArc: splitArc }
    containingArc.rightArc = insertedArc

    /**@type {ActiveSite} */
    let insertedSite = { site: site, arcs: [insertedArc] }
    insertedArc.activeSite = insertedSite
    this.activeSites.push(insertedSite)
    return insertedSite
}

/**
 * @param {ActiveSite} site
 */
VoronoiDiagram.prototype.insertVertexEvents = function(site) {
    const arc = site.arcs[0]
}