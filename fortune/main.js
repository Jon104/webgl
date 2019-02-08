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
 * @typedef {object} ParabolaArc
 * @property {Coordinate} site
 * @property {ParabolaArc} rightArc
 * @property {ParabolaArc} leftArc
 * @property {number} id debug property
 */
/**
 * @typedef {object} Circle
 * @property {Coordinate} centre
 * @property {number} radius
 */
/**
 * @typedef {object} Edge
 * @property {Coordinate} firstFace
 * @property {Coordinate} lastFace
 * @property {Coordinate} leftVertex
 * @property {Coordinate} rightVertex
 * Thie properties topVertex and bottomVertex exist for the edge case where the bisector for two adjacent sites is vertical.
 * @property {Coordinate} topVertex
 * @property {Coordinate} bottomVertex
 */

/**
 * @param {Coordinate} focus
 * @param {number} directrix
 * @param {number} xPos
 * @returns {number}
 */
function parabolaPointY(focus, directrix, xPos) {
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
 * @returns {Circle}
 */
function circle(a, b, c) {
    // Coordinates need to be computed in a deterministic order because otherwise
    // counting errors can cause a different result to be output for the same inputs
    const sortedList = [a, b, c].sort(function(a, b) {
        if (a.y == b.y) {
            return a.x - b.x
        }
        else {
            return a.y - b.y
        }
    })
    a = sortedList[0]
    b = sortedList[1]
    c = sortedList[2]

    const mabx = (a.x + b.x) / 2
    const maby = (a.y + b.y) / 2
    const mbcx = (b.x + c.x) / 2
    const mbcy = (b.y + c.y) / 2
    let igab = 0
    let igbc = 0
    if (b.y - a.y == 0) {
        igab = Infinity
    }
    else {
        igab = (a.x - b.x) / (b.y - a.y)
    }

    if (c.y - b.y == 0) {
        igbc = Infinity
    }
    else {
        igbc = (b.x - c.x) / (c.y - b.y)
    }

    let xVal = 0
    let yVal = 0
    if (igab == Infinity) {
        xVal = mabx
        yVal = (xVal - mbcx) * igbc + mbcy
    }
    else if (igbc == Infinity) {
        xVal = mbcx
        yVal = (xVal - mabx) * igab + maby
    }
    else {
        xVal = (mabx * igab - mbcx * igbc + mbcy - maby) /
            (igab - igbc)
        yVal = (xVal - mabx) * igab + maby
    }
    const radius = Math.sqrt((a.x - xVal) * (a.x - xVal) + (a.y - yVal) * (a.y - yVal))
    return { centre: { x: xVal, y: yVal }, radius: radius }
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {number} xVal
 * @returns {number}
 */
function segmentY(a, b, xVal) {
    let gradient = 0
    if (b.x - a.x == 0) {
        gradient = Number.EPSILON
    }
    else {
        gradient = (b.y - a.y) / (b.x - a.x)
    }

    return (xVal - a.x) * gradient + a.y
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {number} yVal
 * @returns {number}
 */
function segmentX(a, b, yVal) {
    let gradient = 0
    if (b.x - a.x == 0) {
        gradient = Number.EPSILON
    }
    else {
        gradient = (b.y - a.y) / (b.x - a.x)
    }

    return (yVal - a.y) / gradient + a.x
}

/**
 * @param {Coordinate} vector
 * @returns {Coordinate}
 */
function getNormal(vector) {
    const divisor = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
    const unitVector = { x: vector.x / divisor, y: vector.y / divisor }
    return { x: unitVector.y, y: -unitVector.x }
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @param {Coordinate} point
 * @returns {number}
 */
function distanceFromPlane(a, b, point) {
    /**@type {Coordinate} */
    const normal = getNormal({ x: b.x - a.x, y: b.y - a.y })
    /**@type {Coordinate} */
    const transformedPoint = { x: point.x - a.x, y: point.y - a.y }
    return normal.x * transformedPoint.x + normal.y * transformedPoint.y
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

function PriorityQueue() {
    /**@type {SiteEvent[]} */
    this.siteEvents = []
    /**@type {VertexEvent[]} */
    this.vertexEvents = []
    /**@type {VertexEvent[]} */
    this.completedVertexEvents = []
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
    const self = this
    const validEvents = values
        .filter(function(element) { return element != null && element != undefined })
        .filter(function(element) { return !self.hasEventAlready(element) })
    if (validEvents.length > 0) {
        this.vertexEvents = this.vertexEvents.concat(validEvents)
        this.sortVertices()
    }
}

/**
 * @param {VertexEvent} event
 * @returns {boolean}
 */
PriorityQueue.prototype.hasEventAlready = function(event) {
    const self = this
    const activeEvent = this.vertexEvents.find(function(element) { return self.areVertexEventsEqual(element, event) })
    if (activeEvent == undefined) {
        const endedEvent = this.completedVertexEvents.find(function(element) { return self.areVertexEventsEqual(element, event) })
        if (endedEvent == undefined) {
            return false
        }
    }
    
    return true
}

/**
 * @param {VertexEvent} a
 * @param {VertexEvent} b
 * @returns {boolean}
 */
PriorityQueue.prototype.areVertexEventsEqual = function(a, b) {
    const equalVertexPoints = a.vertexPoint.x == b.vertexPoint.x &&
        a.vertexPoint.y == b.vertexPoint.y
    if (equalVertexPoints) {
        let sameSites = true
        a.arcs.forEach(function(element) {
            if (sameSites) {
                sameSites = element.site == b.arcs[0].site || element.site == b.arcs[1].site || element.site == b.arcs[2].site
            }
        })

        return sameSites
    }

    return false
}

/**
 * @param {VertexEvent[]} values
 */
PriorityQueue.prototype.removeVertexEvents = function(values) {
    this.completedVertexEvents = this.completedVertexEvents.concat(values.filter(function(element) { return element != null && element != undefined }))
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
        else {
            return b.eventPoint.y - a.eventPoint.y
        }
    })
}

/**
 * @returns {EventResult}
 */
PriorityQueue.prototype.pop = function() {
    /**@type {EventResult} */
    let event = null
    if (this.vertexEvents.length == 0) {
        event = { isSiteEvent: true, siteEvent: this.siteEvents.pop(), vertexEvent: null }
    }
    else if (this.siteEvents.length == 0) {
        event = { isSiteEvent: false, vertexEvent: this.vertexEvents.pop(), siteEvent: null }
    }
    else {
        const nextSiteEvent = this.siteEvents.pop()
        const nextVertexEvent = this.vertexEvents.pop()
        if (nextSiteEvent.point.y < nextVertexEvent.eventPoint.y) {
            this.vertexEvents.push(nextVertexEvent)
            event = { isSiteEvent: true, siteEvent: nextSiteEvent, vertexEvent: null }
        }
        else {
            this.siteEvents.push(nextSiteEvent)
            event = { isSiteEvent: false, vertexEvent: nextVertexEvent, siteEvent: null }
        }
    }

    if (!event.isSiteEvent) {
        this.completedVertexEvents.push(event.vertexEvent)
    }
    return event
}

function BeachLine() {
    /**@type {ParabolaArc[]} */
    this.arcs = []
    /**@type {ParabolaArc[]} */
    this.deadArcs = []
}

var arcId = 0

/**
 * @param {Coordinate} site
 * @returns {ParabolaArc}
 */
BeachLine.prototype.addInitialArc = function(site) {
    this.arcs.push({ site: site, leftArc: null, rightArc: null, id: arcId++ })
    return this.arcs[0]
}

/**
 * @param {Coordinate} site
 * @param {ParabolaArc} intersectedArc
 * @returns {ParabolaArc}
 */
BeachLine.prototype.addIntersectingArc = function(site, intersectedArc) {
    const intersectedArcLeftArc = intersectedArc.leftArc
    const intersectedArcRightArc = intersectedArc.rightArc
    /**@type {ParabolaArc} */
    const newArc = { site: site, leftArc: null, rightArc: null, id: arcId++ }
    /**@type {ParabolaArc} */
    const leftArc = { site: intersectedArc.site, leftArc: intersectedArcLeftArc, rightArc: newArc, id: arcId++ }
    /**@type {ParabolaArc} */
    const rightArc = { site: intersectedArc.site, rightArc: intersectedArcRightArc, leftArc: newArc, id: arcId++ }
    newArc.leftArc = leftArc
    newArc.rightArc = rightArc
    this.arcs.push(newArc, leftArc, rightArc)
    this.deadArcs.push(intersectedArc)
    this.arcs = this.arcs.filter(function(element) { return element != intersectedArc })
    if (intersectedArcLeftArc != null) {
        intersectedArcLeftArc.rightArc = leftArc
    }

    if (intersectedArcRightArc != null) {
        intersectedArcRightArc.leftArc = rightArc
    }

    return newArc
}

/**
 * @param {Coordinate} leftSite
 * @param {Coordinate} rightSite
 */
BeachLine.prototype.addAdjacentArcs = function(leftSite, rightSite) {
    /**@type {ParabolaArc} */
    const leftArc = { site: leftSite, leftArc: null, rightArc: null, id: arcId++ }
    /**@type {ParabolaArc} */
    const rightArc = { site: rightSite, leftArc: null, rightArc: null, id: arcId++ }
    leftArc.rightArc = rightArc
    rightArc.leftArc = leftArc
    this.arcs.push(leftArc, rightArc)
}

/**
 * @param {ParabolaArc} arc
 */
BeachLine.prototype.removeArc = function(arc) {
    const leftArc = arc.leftArc
    const rightArc = arc.rightArc
    leftArc.rightArc = rightArc
    rightArc.leftArc = leftArc
    this.arcs = this.arcs.filter(function(element) { return element != arc })
    this.deadArcs.push(arc)
}

/**
 * @param {Coordinate} site
 * @returns {ParabolaArc[]}
 */
BeachLine.prototype.getArcsForSite = function(site) {
    const arcs = this.arcs.filter(function(element) { return element.site == site })
    arcs.sort(function(a, b) {
        // The arc is the rightmost arc if it's right arc is null
        // or has a site lower than this arc (ie the right arc is not an intersector)
        if (a.rightArc == null || a.rightArc.site.y < a.site.y) {
            return 1
        }
        else if (b.rightArc == null || b.rightArc.site.y < b.site.y) {
            return -1
        }
        else {
            return a.rightArc.site.x - b.rightArc.site.x
        }
    })
    return arcs
}

/**
 * @param {Coordinate[]} sites
 */
function VoronoiDiagram(sites) {
    /**@type {Coordinate[]} */
    this.sites = []
    /**@type {Edge[]} */
    this.edges = []
    this.lineSweepPosition = 0
    this.queue = new PriorityQueue()
    this.beachLine = new BeachLine()

    this.queue.pushSiteEvents(sites)
    this.insertFirstSites()
}

VoronoiDiagram.prototype.compute =  function() {
    while (!this.queue.isEmpty()) {
        this.computeStep()
    }
    
    this.completeUnboundEdges()
}

VoronoiDiagram.prototype.computeStep = function() {
    const nextEvent = this.queue.pop()
    if (nextEvent.isSiteEvent) {
        console.log('Site event')
        console.log(nextEvent.siteEvent.point)
        console.log(nextEvent.siteEvent.point.y)
        console.log()
        this.lineSweepPosition = nextEvent.siteEvent.point.y
        this.insertSite(nextEvent.siteEvent.point)
    }
    else {
        console.log('Vertex event')
        console.log(nextEvent.vertexEvent.vertexPoint)
        console.log(nextEvent.vertexEvent.arcs[0])
        console.log(nextEvent.vertexEvent.arcs[1])
        console.log(nextEvent.vertexEvent.arcs[2])
        console.log(nextEvent.vertexEvent.eventPoint.y)
        console.log()
        this.lineSweepPosition = nextEvent.vertexEvent.eventPoint.y
        this.processVertexEvent(nextEvent.vertexEvent)
    }
}

VoronoiDiagram.prototype.insertFirstSites = function() {
    const firstSite = this.queue.pop().siteEvent.point
    const secondSite = this.queue.pop().siteEvent.point
    this.sites.push(firstSite)
    this.sites.push(secondSite)
    if (secondSite.y > firstSite.y) {
        const firstArc = this.beachLine.addInitialArc(firstSite)
        this.beachLine.addIntersectingArc(secondSite, firstArc)
        this.createEdge(firstSite, secondSite)
    }
    else {
        this.beachLine.addAdjacentArcs(firstSite, secondSite)
        this.createEdge(firstSite, secondSite)
    }
}

/**
 * @param {Coordinate} site
 */
VoronoiDiagram.prototype.insertSite = function(site) {
    const self = this
    // highest y value is closest to the sweep line
    let closestParabolaYDistance = -Infinity;
    /**@type {Coordinate} */
    let closestParabolaSite = null;
    this.sites.forEach(function(element) {
        const yDist = parabolaPointY(element, self.lineSweepPosition, site.x)
        // If the sweep line has the same yVal as the site then an invalid value of Infinity will be produced
        if (yDist != Infinity && yDist > closestParabolaYDistance) {
            closestParabolaYDistance = yDist
            closestParabolaSite = element
        }
    })

    // Test for equidistant sites
    this.sites.forEach(function(element) {
        const yDist = parabolaPointY(element, self.lineSweepPosition, site.x)
        if (yDist == closestParabolaYDistance && element != closestParabolaSite) {
            console.log('two equally distant parabolas')
            console.log(closestParabolaSite)
            console.log(element)
        }
    })
    console.log('intersects')
    console.log(closestParabolaSite)

    const parabolaArcs = this.beachLine.getArcsForSite(closestParabolaSite)
    if (parabolaArcs.length == 0) {
        console.log('parabola site')
        console.log(closestParabolaSite)
        console.log()
    }
    /**@type {ParabolaArc} */
    let containingArc = null
    if (parabolaArcs.length == 1) {
        containingArc = parabolaArcs[0]
    }
    else {
        // If there's more than one arc on the parabola then there's another parabola subdividing it and checking the position of the related site point
        // should indicate which arc the new site falls on
        parabolaArcs.slice(0, parabolaArcs.length - 1).forEach(function(arc) {
            if (arc.rightArc.site.x > site.x) {
                containingArc = arc
                return
            }
        })
        // If the end is reached without the containing arc found then it must be the last arc
        // of the parabola, with its right neighbour being the parabola that this parabola subdivides
        // or null if this is the last parabola on the beachline
        if (containingArc == null) {
            containingArc = parabolaArcs[parabolaArcs.length - 1]
        }
    }

    this.sites.push(site)
    this.updateBeachLine(site, containingArc)
}

/**
 * @param {Coordinate} site
 * @param {ParabolaArc} intersectedArc
 */
VoronoiDiagram.prototype.updateBeachLine = function(site, intersectedArc) {
    const newArc = this.beachLine.addIntersectingArc(site, intersectedArc)
    
    this.createEdge(site, intersectedArc.site)
    this.updateVertexEvents(intersectedArc, newArc)
}

/**
 * @param {ParabolaArc} intersectedArc
 * @param {ParabolaArc} newArc
 */
VoronoiDiagram.prototype.updateVertexEvents = function(intersectedArc, newArc) {
    // The intersected arc will have had a vertex event for each of its neighbours
    // For those neighbours the arc at the other end of the edge will become newArc
    // The old circle/event point is invalid so the old event should be killed off and a new one inserted
    const leftNeighbour = intersectedArc.leftArc
    const rightNeighbour = intersectedArc.rightArc
    const leftEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[0] == leftNeighbour
    })
    const rightEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[2] == rightNeighbour
    })
    this.queue.removeVertexEvents([leftEvent, rightEvent])
    /**@type {VertexEvent[]} */
    const newEvents = []
    const newLeftEvent = this.getVertexEvent(newArc.leftArc)
    const newRightEvent = this.getVertexEvent(newArc.rightArc)

    // Check that the vertex is on the same side as the arc that is to be squeezed out
    if (newLeftEvent != null && newArc.site.x > newLeftEvent.vertexPoint.x) {
        newEvents.push(newLeftEvent)
    }

    if (newRightEvent != null && newArc.site.x < newRightEvent.vertexPoint.x) {
        newEvents.push(newRightEvent)
    }
    
    this.queue.pushVertexEvents(newEvents)

    // It is also possible that the intersected arc was a left or right member of a vertex event
    // in which case the arc will need to be replaced, however the vertex itself remains the same
    const intersectedOnLeftEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[0] == intersectedArc
    })
    const intersectedOnRightEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[2] == intersectedArc
    })
    if (intersectedOnLeftEvent) {
        intersectedOnLeftEvent.arcs[0] = newArc.rightArc
    }

    if (intersectedOnRightEvent) {
        intersectedOnRightEvent.arcs[2] = newArc.leftArc
    }
}

/**
 * @param {ParabolaArc} leftArc
 * @param {ParabolaArc} rightArc
 */
VoronoiDiagram.prototype.updateVertexEventsAfterDeletedArc = function(leftArc, rightArc) {
    // The left and right arc will have had a vertex event for their left and right neighbours respectively
    // For those events the deleted arc will be replaced by the arc on the other side of the join
    const leftEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[1] == leftArc
    })
    const rightEvent = this.queue.vertexEvents.find(function(element) {
        return element.arcs[1] == rightArc
    })
    this.queue.removeVertexEvents([leftEvent, rightEvent])
    /**@type {VertexEvent[]} */
    const newEvents = []
    const newLeftEvent = this.getVertexEvent(leftArc)
    const newRightEvent = this.getVertexEvent(rightArc)

    const edge = this.getEdge(leftArc.site, rightArc.site)
    // To validate the vertex events, check the existing shared vertex.
    // If it's the left vertex and the event is to the right of it then the event is valid and vice versa
    if (edge.leftVertex != null) {
        if (newLeftEvent != null && newLeftEvent.vertexPoint.x >= edge.leftVertex.x) {
            newEvents.push(newLeftEvent)
        }

        if (newRightEvent != null && newRightEvent.vertexPoint.x >= edge.leftVertex.x) {
            newEvents.push(newRightEvent)
        }
    }
    else if (edge.rightVertex != null) {
        if (newLeftEvent != null && newLeftEvent.vertexPoint.x <= edge.rightVertex.x) {
            newEvents.push(newLeftEvent)
        }

        if (newRightEvent != null && newRightEvent.vertexPoint.x <= edge.rightVertex.x) {
            newEvents.push(newRightEvent)    
        }
    }
    else {
        if (edge.bottomVertex != null) {
            if (newLeftEvent != null &&
                newLeftEvent.vertexPoint.x == edge.bottomVertex.x) {
                newEvents.push(newLeftEvent)
            }

            if (newRightEvent != null &&
                newRightEvent.vertexPoint.x == edge.bottomVertex.x) {
                newEvents.push(newRightEvent)
            }
        }
        else if (edge.topVertex != null) {
            console.log('edge assumptions were wrong')
        }
        else {
            console.log('edge assumptions were very wrong')
        }
    }

    this.queue.pushVertexEvents(newEvents)
}

/**
 * @param {ParabolaArc} arc
 * @returns {VertexEvent}
 */
VoronoiDiagram.prototype.getVertexEvent = function(arc) {
    if (arc.leftArc == null || arc.rightArc == null) {
        return null
    }

    const leftSite = arc.leftArc.site
    const middleSite = arc.site
    const rightSite = arc.rightArc.site
    if (leftSite == middleSite || middleSite == rightSite || leftSite == rightSite) {
        console.log('Circular vertex event')
        return null
    }

    const circleResult = circle(leftSite, middleSite, rightSite)
    if (circleResult.centre.x == Infinity || circleResult.centre.y == Infinity) {
        return null
    }

    const eventY = circleResult.centre.y + circleResult.radius
    if (eventY < this.lineSweepPosition) {
        return null
    }

    /**@type {Coordinate} */
    const eventPoint = { x: circleResult.centre.x, y: eventY }
    return {
        arcs: [arc.leftArc, arc, arc.rightArc],
        eventPoint: eventPoint,
        vertexPoint: circleResult.centre
    }
}

/**
 * @param {VertexEvent} vertexEvent
 */
VoronoiDiagram.prototype.processVertexEvent = function(vertexEvent) {
    const leftArc = vertexEvent.arcs[0]
    const rightArc = vertexEvent.arcs[2]
    const deletedArc = vertexEvent.arcs[1]
    this.beachLine.removeArc(deletedArc)
    
    // Since there are now two newly neighbouring arcs there will also be a new edge between the arc sites
    this.createEdgeForNewAdjacentSites(leftArc.site, rightArc.site, vertexEvent.vertexPoint)
    this.updateEdgeForDeletedArc(
        leftArc.site,
        rightArc.site,
        deletedArc.site,
        vertexEvent.vertexPoint
    )
    this.updateVertexEventsAfterDeletedArc(leftArc, rightArc)
}

/**
 * @param {Coordinate} leftSite
 * @param {Coordinate} rightSite
 * @param {Coordinate} vertex
 */
VoronoiDiagram.prototype.createEdgeForNewAdjacentSites = function(leftSite, rightSite, vertex) {
    const edge = this.createEdge(leftSite, rightSite)
    if (leftSite.y > rightSite.y) {
        edge.leftVertex = vertex
    }
    else if (leftSite.y < rightSite.y) {
        edge.rightVertex = vertex
    }
    else {
        edge.bottomVertex = vertex
    }
}

/**
 * @param {Coordinate} leftSite
 * @param {Coordinate} rightSite
 * @param {Coordinate} deletedSite
 * @param {Coordinate} vertex
 */
VoronoiDiagram.prototype.updateEdgeForDeletedArc = function(leftSite, rightSite, deletedSite, vertex) {
    const leftEdge = this.getEdge(leftSite, deletedSite)
    const rightEdge = this.getEdge(rightSite, deletedSite)
    // Which vertex of the edge is getting set will depend on which arc was the interceptor and which side the intercepted arc fell on
    if (leftSite.y > deletedSite.y) {
        leftEdge.rightVertex = vertex
    }
    else if (leftSite.y < deletedSite.y) {
        leftEdge.leftVertex = vertex
    }
    else {
        leftEdge.topVertex = vertex
    }

    if (rightSite.y > deletedSite.y) {
        rightEdge.leftVertex = vertex
    }
    else if (rightSite.y < deletedSite.y) {
        rightEdge.rightVertex = vertex
    }
    else {
        rightEdge.topVertex = vertex
    }
}

/**
 * @param {Coordinate} firstSite
 * @param {Coordinate} lastSite
 * @returns {Edge}
 */
VoronoiDiagram.prototype.createEdge = function(firstSite, lastSite) {
    /**@type {Edge} */
    const edge = {
        firstFace: firstSite,
        lastFace: lastSite,
        leftVertex: null,
        rightVertex: null,
        topVertex: null,
        bottomVertex: null
    }
    this.edges.push(edge)
    return edge
}

/**
 * @param {Coordinate} a
 * @param {Coordinate} b
 * @returns {Edge}
 */
VoronoiDiagram.prototype.getEdge = function(a, b) {
    return this.edges.find(function(element) {
        return (element.firstFace == a && element.lastFace == b) ||
        (element.firstFace == b && element.lastFace == a)
    })
}

VoronoiDiagram.prototype.completeUnboundEdges = function() {
    this.edges.forEach(function(edge) {
        if (edge.leftVertex == null && edge.rightVertex == null && edge.topVertex == null && edge.bottomVertex == null) {
            console.log('error: unvertexed edge')
            return
        }
        // Edge is completely filled
        else if (edge.leftVertex != null && edge.rightVertex != null) {
            return
        }
        // Possibly vertical edges
        else if (edge.bottomVertex != null && edge.topVertex != null) {
            edge.leftVertex = edge.bottomVertex
            edge.rightVertex = edge.topVertex
        }
        else if (edge.bottomVertex != null) {
            if (edge.leftVertex != null) {
                edge.rightVertex = edge.bottomVertex
            }
            else if (edge.rightVertex != null) {
                edge.leftVertex = edge.bottomVertex
            }
            else {
                edge.leftVertex = edge.bottomVertex
                edge.rightVertex = { x: edge.bottomVertex.x, y: 100 }
            }
        }
        else if (edge.topVertex != null) {
            if (edge.leftVertex != null) {
                edge.rightVertex = edge.topVertex
            }
            else if (edge.rightVertex != null) {
                edge.leftVertex = edge.topVertex
            }
            else {
                edge.rightVertex = edge.topVertex
                edge.leftVertex = { x: edge.topVertex.x, y: -100 }
            }
        }
        else if (edge.leftVertex != null) {
            edge.rightVertex = { x: 100, y: bisectorY(edge.firstFace, edge.lastFace, 100) }
        }
        else {
            edge.leftVertex = { x: -100, y: bisectorY(edge.firstFace, edge.lastFace, -100) }
        }
    })
}

/**
 * @param {VoronoiDiagram} diagram
 */
function verifyBeachLineIntegrity(diagram) {
    /**@type {Coordinate[]} */
    const order = []

    let currentArc = diagram.beachLine.arcs[0]
    while (currentArc.leftArc != null) {
        currentArc = currentArc.leftArc
    }

    while (currentArc != null) {
        order.push(currentArc.site)
        currentArc = currentArc.rightArc
    }

    const reverseOrder = order.slice(0, order.length)
    reverseOrder.reverse()

    diagram.beachLine.arcs.forEach(function(arc) {
        currentArc = arc
        while(currentArc.leftArc != null) {
            currentArc = currentArc.leftArc
        }

        let i = 0
        while(currentArc != null) {
            if (currentArc.site.x != order[i].x || currentArc.site.y != order[i].y) {
                console.log('ERROR: beachline inconsistent')
            }

            currentArc = currentArc.rightArc
            i++
        }

        currentArc = arc
        while(currentArc.rightArc != null) {
            currentArc = currentArc.rightArc
        }

        i = 0
        while(currentArc != null) {
            if (currentArc.site.x != reverseOrder[i].x || currentArc.site.y != reverseOrder[i].y) {
                console.log('ERROR: beachline inconsistent')
            }

            currentArc = currentArc.leftArc
            i++
        }
    })
}

/**
 * @param {VoronoiDiagram} diagram
 */
function logBeachLine(diagram) {
    let currentArc = diagram.beachLine.arcs[0]
    let traversals = 0
    while (currentArc.leftArc != null) {
        currentArc = currentArc.leftArc
        traversals++
    }

    console.log('beachline start, ' + traversals + ' traversals')
    while(currentArc != null) {
        console.log(currentArc)
        currentArc = currentArc.rightArc
    }
}

/**
 * @param {ParabolaArc} randomArc
 */
function reverseLogBeachLine(randomArc) {
    let currentArc = randomArc
    let traversals = 0
    while (currentArc.rightArc != null) {
        currentArc = currentArc.rightArc
        traversals++
    }

    console.log('reverse beachline start, ' + traversals + ' traversals')
    while(currentArc != null) {
        console.log(currentArc.site)
        currentArc = currentArc.leftArc
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

/**
 * @returns {CanvasRenderingContext2D}
 */
function getCanvas() {
    const existingElement = document.getElementById('canvas')
    if (existingElement) {
        document.body.removeChild(existingElement)
    }

    const canvasElement = document.createElement('canvas')
    canvasElement.id = 'canvas'
    document.body.appendChild(canvasElement)
    canvasElement.width = 10000
    canvasElement.height = 10000
    return canvasElement.getContext('2d')
}

/**
 * @param {VoronoiDiagram} diagram
 */
function drawDiagramToCanvas(diagram) {
    const canvas = getCanvas()
    diagram.edges.forEach(function(element) {
        if (element.leftVertex != null && element.rightVertex != null) {
            drawLine(canvas, element.leftVertex, element.rightVertex)
        }
        else if (element.leftVertex != null) {
            drawCircle(canvas, element.leftVertex, true)
        }
        else if (element.rightVertex != null) {
            drawCircle(canvas, element.rightVertex, true)
        }
    })
    diagram.sites.forEach(function(element) {
        drawPoint(canvas, element, true)
    })
    diagram.queue.vertexEvents.forEach(function(element) {
        drawPoint(canvas, element.vertexPoint, false)
    })
}

/**
 * @param {CanvasRenderingContext2D} canvas
 * @param {Coordinate} point
 * @param {boolean} fill
 */
function drawPoint(canvas, point, fill) {
    const size = 10.0
    const correctedPoint = correctedCoordinate(point)
    const x = correctedPoint.x - size / 2
    const y = correctedPoint.y - size / 2
    if (fill) {
        canvas.fillRect(x, y, size, size)
    }
    else {
        canvas.strokeRect(x, y, size, size)
    }
}

/**
 * @param {CanvasRenderingContext2D} canvas
 * @param {Coordinate} point
 * @param {boolean} fill
 */
function drawCircle(canvas, point, fill) {
    const radius = 5.0
    const correctedPoint = correctedCoordinate(point)
    canvas.beginPath()
    canvas.arc(correctedPoint.x, correctedPoint.y, radius, 0, Math.PI * 2)
    if (fill) {
        canvas.fill()
    }
    else {
        canvas.stroke()
    }
}

/**
 * @param {CanvasRenderingContext2D} canvas
 * @param {Coordinate} start
 * @param {Coordinate} end
 */
function drawLine(canvas, start, end) {
    const correctedStart = correctedCoordinate(start)
    const correctedEnd = correctedCoordinate(end)
    canvas.beginPath()
    canvas.moveTo(correctedStart.x, correctedStart.y)
    canvas.lineTo(correctedEnd.x, correctedEnd.y)
    canvas.stroke()
}

/**
 * @param {Coordinate} coord
 * @returns {Coordinate}
 */
function correctedCoordinate(coord) {
    const x = coord.x * 25 + 500
    const y = -coord.y * 25 + 800
    return { x: x, y: y }
}

/**@type {Coordinate[]} */
const sites = []
var siteCount = 0
while (siteCount < 12) {
    const coordinate = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) }
    if (!sites.find(function(element) { return element.x == coordinate.x && element.y == coordinate.y })) {
        sites.push(coordinate)
        siteCount++
    }
}

const diagram = new VoronoiDiagram([
    {x: 7, y: 8},
{x: 13, y: 7},
{x: 0, y: 3},
{x: 9, y: 3},
{x: 5, y: 9},
{x: 10, y: 3}
])

console.log(sites)

/**
 * @param {VoronoiDiagram} diagram
 */
function logVertexEvents(diagram) {
    console.log('vertex triples')
    diagram.queue.vertexEvents.forEach(function(element) {
        console.log(element.arcs[0].site)
        console.log(element.arcs[1].site)
        console.log(element.arcs[2].site)
        console.log()
        console.log(element.vertexPoint)
        console.log(element.eventPoint)
        console.log()
    })
}

// logEdges(diagram)

while (!diagram.queue.isEmpty()) {
//for (var i = 0; i < 5; i++) {
    diagram.computeStep()
    verifyBeachLineIntegrity(diagram)
    logBeachLine(diagram)
}


diagram.completeUnboundEdges()
// diagram.compute()

// logEdges(diagram)
console.log(diagram)
drawDiagramToCanvas(diagram)