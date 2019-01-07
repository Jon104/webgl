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
 * @property {SiteEvent} siteEvent
 * @property {VertexEvent} vertexEvent
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
PriorityQueue.prototype.isEmpty = function() { return this.siteEvents.length == 0 && this.vertexEvents.length == 0 }

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
    if (this.vertexEvents.length == 0) {
        return { isSiteEvent: true, siteEvent: this.siteEvents.pop(), vertexEvent: null }
    }
    if (this.siteEvents.length == 0) {
        return { isSiteEvent: false, vertexEvent: this.vertexEvents.pop(), siteEvent: null }
    }

    const nextSiteEvent = this.siteEvents.pop()
    const nextVertexEvent = this.vertexEvents.pop()
    if (nextSiteEvent.point.y < nextVertexEvent.eventPoint.y) {
        this.vertexEvents.push(nextVertexEvent)
        return { isSiteEvent: true, siteEvent: nextSiteEvent, vertexEvent: null }
    }
    else {
        this.siteEvents.push(nextSiteEvent)
        return { isSiteEvent: false, vertexEvent: nextVertexEvent, siteEvent: null }
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
    this.insertFirstSite(this.queue.pop().siteEvent.point)
    logBeachLine(this.activeSites[0].arcs[0])

    while (!this.queue.isEmpty()) {
        const nextEvent = this.queue.pop()
        if (nextEvent.isSiteEvent) {
            this.lineSweepPosition = nextEvent.siteEvent.point.y
            const activeSite = this.insertSite(nextEvent.siteEvent.point)
            this.updateVertexEvents(activeSite)
        }
        else {
            this.lineSweepPosition = nextEvent.vertexEvent.eventPoint.y
            this.processVertexEvent(nextEvent.vertexEvent)
        }
        
        console.log(this.queue.vertexEvents.map(function(event) {
            return { left: event.arcs[0].activeSite.site, middle: event.arcs[1].activeSite.site, right: event.arcs[2].activeSite.site }
        }))
        // logBeachLine(this.activeSites[0].arcs[0])
    }
}

/**
 * @param {Coordinate} site
 * @returns {ActiveSite}
 */
VoronoiDiagram.prototype.insertFirstSite = function(site) {
    /**@type {ActiveSite} */
    const firstSite = { site: site, arcs: null }
    this.activeSites.push(firstSite)
    firstSite.arcs = [{ activeSite: this.activeSites[0], leftArc: null, rightArc: null }]
    return firstSite
}

/**
 * @param {Coordinate} site
 * @returns {ActiveSite}
 */
VoronoiDiagram.prototype.insertSite = function(site) {
    const self = this
    // highest y value is closest to the sweep line
    let closestParabolaYDistance = -Infinity;
    /**@type {ActiveSite} */
    let closestParabolaSite = null;
    this.activeSites.forEach(function(element) {
        let yDist = parabolaPoint(element.site, self.lineSweepPosition, site.x).y
        if (yDist > closestParabolaYDistance) {
            closestParabolaYDistance = yDist
            closestParabolaSite = element
        }
    })

    /**@type {ParabolaArc} */
    let containingArc = null
    if (closestParabolaSite.arcs.length == 1) {
        containingArc = closestParabolaSite.arcs[0]
    }
    else {
        // If there's more than one arc on the parabola then there's another parabola subdividing it and checking the position of the related site point
        // should indicate which arc the new site falls on
        closestParabolaSite.arcs.slice(0, closestParabolaSite.arcs.length - 1).forEach(function(arc) {
            if (arc.rightArc.activeSite.site.x > site.x) {
                containingArc = arc
                return
            }
        })
        // If the end is reached without the containing arc found then it must be the last arc
        // of the parabola, with its right neighbour being the parabola that this parabola subdivides
        // or null if this is the last parabola on the beachline
        if (containingArc == null) {
            containingArc = closestParabolaSite.arcs[closestParabolaSite.arcs.length - 1]
        }
    }

    // Split containing arc and insert new arc between them
    /**@type {ParabolaArc} */
    const splitArc = { activeSite: closestParabolaSite, rightArc: containingArc.rightArc, leftArc: null }
    /**@type {ParabolaArc} */
    const insertedArc = { activeSite: null, rightArc: splitArc, leftArc: null }
    containingArc.rightArc = insertedArc
    insertedArc.leftArc = containingArc
    splitArc.leftArc = insertedArc

    /**@type {ActiveSite} */
    const insertedSite = { site: site, arcs: [insertedArc] }
    insertedArc.activeSite = insertedSite
    this.activeSites.push(insertedSite)

    closestParabolaSite.arcs.push(splitArc)
    closestParabolaSite.arcs.sort(function(a, b) {
        if (a.rightArc == null) {
            return 1
        }
        else if (b.rightArc == null) {
            return -1
        }
        else {
            return a.rightArc.activeSite.site.x - b.rightArc.activeSite.site.x
        }
    })

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
        [arc, arc.rightArc, arc.rightArc.rightArc],
        [arc.leftArc, arc, arc.rightArc],
        [arc.leftArc.leftArc, arc.leftArc, arc]
    ]
    const validTriples = possibleTriples
    .filter(function(triple) {
        return triple[0] != null && triple[1] != null && triple[2] != null
    })
    .filter(function(triple) {
        return triple[0].activeSite != triple[1].activeSite && triple[0].activeSite != triple[2].activeSite && triple[1].activeSite != triple[2].activeSite
    })
    /**@type {VertexEvent[]} */
    const vertexEvents = validTriples.map(function(triple) {
        const circleResult = circle(triple[0].activeSite.site, triple[1].activeSite.site, triple[2].activeSite.site)
        const eventPoint = { x: circleResult.centre.x, y: circleResult.centre.y + circleResult.radius }
        return { arcs: triple, vertexPoint: circleResult.centre, eventPoint: eventPoint }
    })
    this.queue.pushVertexEvents(vertexEvents)
}

/**
 * @param {VertexEvent} vertexEvent
 */
VoronoiDiagram.prototype.processVertexEvent = function(vertexEvent) {
    this.vertices.push(vertexEvent.vertexPoint)
    const deletedArc = vertexEvent.arcs[1]
    deletedArc.activeSite.arcs = deletedArc.activeSite.arcs.filter(function(arc) { return arc != deletedArc })
    vertexEvent.arcs[0].rightArc = vertexEvent.arcs[2]
    vertexEvent.arcs[2].leftArc = vertexEvent.arcs[0]
}

/**
 * @param {ParabolaArc} randomArc
 */
function logBeachLine(randomArc) {
    let currentArc = randomArc
    while (currentArc.leftArc != null) {
        currentArc = currentArc.leftArc
    }

    console.log('beachline start')
    while(currentArc != null) {
        console.log(currentArc.activeSite.site)
        currentArc = currentArc.rightArc
    }
}

const diagram = new VoronoiDiagram()
/**@type {Coordinate[]} */
const sites = [
    { x: 2, y: 2 },
    { x: 8, y: 4 },
    { x: 2, y: 8 },
    { x: 8, y: 12 }
]
diagram.compute(sites)