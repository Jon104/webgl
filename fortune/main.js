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
 * @typedef {object} Edge
 * @property {Coordinate} leftFace
 * @property {Coordinate} rightFace
 * @property {Coordinate} firstVertex
 * @property {Coordinate} lastVertex
 */

/**
 * @param {Coordinate} focus
 * @param {number} directrix
 * @param {number} xPos
 * @returns {number}
 */
function  parabolaPointY(focus, directrix, xPos) {
    // transform all coordinates such that the focus is the origin
    // this allows for a much simpler equation and the result can be transformed back
    directrix -= focus.y
    xPos -= focus.x
    return (((directrix * directrix) - (xPos * xPos)) / (2 * directrix)) + focus.y
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {Coordinate} c
 * @returns {CircleResult}
 */
function circle(a, b, c) {
    const mabx = (a.x + b.x) / 2
    const maby = (a.y + b.y) / 2
    const mbcx = (b.x + c.x) / 2
    const mbcy = (b.y + c.y) / 2
    const macx = (a.x + c.x) / 2
    const macy = (a.y + c.y) / 2
    let igab = 0
    let igbc = 0
    let igca = 0
    if (b.y - a.y == 0) {
        igab = (a.x - b.x) / Number.EPSILON
    }
    else {
        igab = (a.x - b.x) / (b.y - a.y)
    }
    if (c.y - b.y == 0) {
        igbc = (b.x - c.x) / Number.EPSILON
    }
    else {
        igbc = (b.x - c.x) / (c.y - b.y)
    }
    if (a.y - c.y == 0) {
        igca = (c.x - a.x) / Number.EPSILON
    }
    else {
        igca = (c.x - a.x) / (a.y - c.y)
    }
    const xVal = (-mbcx * igbc + mbcy - macx * igca + macy + 2 * (mabx * igab - maby)) /
        (2 * igab - igbc - igca)
    const yVal = (xVal - mabx) * igab + maby
    const radius = Math.sqrt((a.x - xVal) * (a.x - xVal) + (a.y - yVal) * (a.y - yVal))
    return { centre: { x: xVal, y: yVal }, radius: radius }
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {number} xVal
 * @returns {number}
 */
function bisectorY(a, b, xVal) {
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    let inverseGrad = 0
    if (b.y - a.y == 0) {
        inverseGrad = Number.EPSILON
    }
    else {
        inverseGrad = (a.x - b.x) / (b.y - a.y)
    }

    return (xVal - midX) * inverseGrad + midY
}

/**
 * @param {Coordinate[]} acc
 * @param {Edge} element
 * @returns {Coordinate[]}
 */
function flattenEdges(acc, element) {
    acc.push(element.firstVertex)
    acc.push(element.lastVertex)
    return acc
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
    this.vertexEvents = this.vertexEvents.concat(values)
    this.sortVertices()
}

/**
 * @param {VertexEvent[]} values
 */
PriorityQueue.prototype.removeVertexEvents = function(values) {
    this.vertexEvents = this.vertexEvents.filter(function(element) { return values.indexOf(element) == -1 })
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
            return b.point.x - a.point.x
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
            return b.eventPoint.x - a.eventPoint.x
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
    /**@type {ActiveSite[]} */
    this.activeSites = []
    /**@type {Edge[]} */
    this.edges = []
    this.lineSweepPosition = 0
    this.queue = new PriorityQueue()
}

/**
 * @param {Coordinate[]} sites
 */
VoronoiDiagram.prototype.compute =  function(sites) {
    this.queue.pushSiteEvents(sites)
    this.insertFirstSite(this.queue.pop().siteEvent.point)
    // logBeachLine(this.activeSites[0].arcs[0])

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
        const yDist = parabolaPointY(element.site, self.lineSweepPosition, site.x)
        // If the sweep line has the same yVal as the site then an invalid value of Infinity will be produced
        if (yDist != Infinity && yDist > closestParabolaYDistance) {
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
    // console.log('broken triples ' + JSON.stringify(brokenVertexEvents.map(function(event) {
    //     return { left: event.arcs[0].activeSite.site, middle: event.arcs[1].activeSite.site, right: event.arcs[2].activeSite.site }
    // })))
    this.queue.removeVertexEvents(brokenVertexEvents)
    const leftTriple = [arc.leftArc.leftArc, arc.leftArc, arc]
    const rightTriple = [arc, arc.rightArc, arc.rightArc.rightArc]
    /**@type {ParabolaArc[][]} */
    const validTriples = []
    if (leftTriple[0] != null && leftTriple[1] != null && leftTriple[2] != null) {
        if (arc.leftArc.leftArc.activeSite.site.x < arc.leftArc.activeSite.site.x) {
            validTriples.push(leftTriple)
        }
    }

    if (rightTriple[0] != null && rightTriple[1] != null && rightTriple[2] != null) {
        if (arc.rightArc.rightArc.activeSite.site.x > arc.rightArc.activeSite.site.x) {
            validTriples.push(rightTriple)
        }
    }

    /**@type {VertexEvent[]} */
    const vertexEvents = validTriples.map(function(triple) {
        const circleResult = circle(triple[0].activeSite.site, triple[1].activeSite.site, triple[2].activeSite.site)
        /*console.log('triple: ' + JSON.stringify(triple.map(function(element) { return element.activeSite.site })))
        console.log('vertex calculated: ' + JSON.stringify(circleResult.centre))
        console.log('radius calculated: ' + circleResult.radius)*/
        const eventPoint = { x: circleResult.centre.x, y: circleResult.centre.y + circleResult.radius }
        return { arcs: triple, vertexPoint: circleResult.centre, eventPoint: eventPoint }
    })
    this.queue.pushVertexEvents(vertexEvents)
}

/**
 * @param {VertexEvent} vertexEvent
 */
VoronoiDiagram.prototype.processVertexEvent = function(vertexEvent) {
    const deletedArc = vertexEvent.arcs[1]
    deletedArc.activeSite.arcs = deletedArc.activeSite.arcs.filter(function(arc) { return arc != deletedArc })
    vertexEvent.arcs[0].rightArc = vertexEvent.arcs[2]
    vertexEvent.arcs[2].leftArc = vertexEvent.arcs[0]
    this.updateEdges(
        vertexEvent.vertexPoint,
        vertexEvent.arcs[0].activeSite,
        vertexEvent.arcs[1].activeSite,
        vertexEvent.arcs[2].activeSite
    )
}

/**
 * @param {Coordinate} vertex
 * @param {ActiveSite} siteA
 * @param {ActiveSite} siteB
 * @param {ActiveSite} siteC
 */
VoronoiDiagram.prototype.updateEdges = function(vertex, siteA, siteB, siteC) {
    const sortedSites = [siteA, siteB, siteC].sort(function(a, b) { return a.site.x - b.site.x })
    const leftSite = sortedSites[0]
    const middleSite = sortedSites[1]
    const rightSite = sortedSites[2]
    // console.log('triple')
    // console.log(leftSite.site)
    // console.log(middleSite.site)
    // console.log(rightSite.site)
    this.updateEdge(vertex, leftSite, middleSite)
    this.updateEdge(vertex, middleSite, rightSite)
}

/**
 * @param {Coordinate} vertex
 * @param {ActiveSite} leftSite
 * @param {ActiveSite} rightSite
 */
VoronoiDiagram.prototype.updateEdge = function(vertex, leftSite, rightSite) {
    // console.log('left site')
    // console.log(leftSite.site)
    // console.log('right site')
    // console.log(rightSite.site)
    const existingEdge = this.edges.find(function(element) {
        return element.leftFace == leftSite.site && element.rightFace == rightSite.site
    })
    if (existingEdge) {
        const existingVertex = existingEdge.firstVertex
        if (existingVertex.x > vertex.x) {
            existingEdge.lastVertex = existingVertex
            existingEdge.firstVertex = vertex
        }
        else {
            existingEdge.lastVertex = vertex
        }
    }
    else {
        this.edges.push({ leftFace: leftSite.site, rightFace: rightSite.site, firstVertex: vertex, lastVertex: null })
    }
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

/**
 * @param {VoronoiDiagram} diagram
 */
function logEdges(diagram) {
    diagram.edges.forEach(function(element) {
        console.log(element)
    })
}

const diagram = new VoronoiDiagram()
/**@type {Coordinate[]} */
const sites = [
    { x: 2, y: 9 },
    { x: 3, y: 7 },
    { x: 3, y: 2 },
    { x: 5, y: 2 },
    { x: 5, y: 5 },
    { x: 6, y: 6 },
    { x: 7, y: 1 },
    { x: 8, y: 4 },
    { x: 8, y: 8 }
]
diagram.compute(sites)
logEdges(diagram)