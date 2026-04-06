/**
 * XML parsing utilities for Irish Rail API responses
 */

const parser = new DOMParser();

/**
 * Parse XML string into an array of objects
 * Each child element of the root becomes an object with its children as properties
 */
export function parseXML(xmlString) {
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
        throw new Error('Failed to parse XML response');
    }
    const root = doc.documentElement;
    const items = [];
    for (const child of root.children) {
        items.push(xmlNodeToObject(child));
    }
    return items;
}

/**
 * Convert an XML element to a plain JS object
 */
function xmlNodeToObject(node) {
    const obj = {};
    for (const child of node.children) {
        const key = child.localName || child.nodeName;
        obj[key] = child.textContent.trim();
    }
    return obj;
}

/**
 * Parse station list XML
 * Returns: [{StationDesc, StationAlias, StationLatitude, StationLongitude, StationCode, StationId}]
 */
export function parseStations(xmlString) {
    return parseXML(xmlString);
}

/**
 * Parse station data XML (departures/arrivals)
 * Returns: [{Traincode, Stationfullname, Stationcode, Querytime, Traindate, Origin, Destination,
 *            Origintime, Destinationtime, Status, Lastlocation, Duein, Late, Exparrival,
 *            Expdepart, Schdepart, Scharrival, Direction, Traintype, Locationtype}]
 */
export function parseStationData(xmlString) {
    return parseXML(xmlString);
}

/**
 * Parse current trains XML
 * Returns: [{TrainStatus, TrainLatitude, TrainLongitude, TrainCode, TrainDate, PublicMessage, Direction, TrainType}]
 */
export function parseCurrentTrains(xmlString) {
    return parseXML(xmlString);
}

/**
 * Parse train movements XML
 * Returns: [{TrainCode, TrainDate, LocationCode, LocationFullName, LocationOrder, LocationType,
 *            TrainOrigin, TrainDestination, ScheduledArrival, ScheduledDeparture,
 *            ExpectedArrival, ExpectedDeparture, Arrival, Departure, AutoArrival,
 *            AutoDepart, StopType}]
 */
export function parseTrainMovements(xmlString) {
    return parseXML(xmlString);
}
