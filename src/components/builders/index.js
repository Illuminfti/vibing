/**
 * Component Builders Index
 *
 * Exports all component builders for easy access.
 */

const gateComponents = require('./gateComponents');
const sanctuaryComponents = require('./sanctuaryComponents');
const reactionComponents = require('./reactionComponents');

module.exports = {
    ...gateComponents,
    ...sanctuaryComponents,
    ...reactionComponents,
};
