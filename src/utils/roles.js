const config = require('../config');

/**
 * Assign a gate role to a member
 */
async function assignGateRole(member, gateNumber) {
    const roleId = config.getGateRole(gateNumber);
    if (!roleId) {
        console.error(`No role configured for gate ${gateNumber}`);
        return false;
    }

    try {
        const role = member.guild.roles.cache.get(roleId);
        if (!role) {
            console.error(`Role ${roleId} not found for gate ${gateNumber}`);
            return false;
        }

        await member.roles.add(role);
        return true;
    } catch (error) {
        console.error(`Failed to assign gate ${gateNumber} role:`, error);
        return false;
    }
}

/**
 * Assign the Ascended role
 */
async function assignAscendedRole(member) {
    try {
        const role = member.guild.roles.cache.get(config.roles.ascended);
        if (!role) {
            console.error('Ascended role not found');
            return false;
        }

        await member.roles.add(role);
        return true;
    } catch (error) {
        console.error('Failed to assign Ascended role:', error);
        return false;
    }
}

/**
 * Remove all gate roles from a member
 */
async function removeAllGateRoles(member) {
    const roleIds = [
        config.roles.lostSoul,
        ...config.getAllGateRoles(),
        config.roles.ascended,
    ].filter(Boolean);

    try {
        for (const roleId of roleIds) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to remove gate roles:', error);
        return false;
    }
}

/**
 * Check if member has a specific role
 */
function hasRole(member, roleId) {
    if (!member || !roleId) return false;
    return member.roles.cache.has(roleId);
}

/**
 * Check if user object has a specific role (fetches member if needed)
 */
async function userHasRole(guild, userId, roleId) {
    try {
        const member = await guild.members.fetch(userId);
        return hasRole(member, roleId);
    } catch (error) {
        return false;
    }
}

/**
 * Get all members with a specific role
 */
async function getMembersWithRole(guild, roleId) {
    try {
        await guild.members.fetch();
        const role = guild.roles.cache.get(roleId);
        if (!role) return [];
        return Array.from(role.members.values());
    } catch (error) {
        console.error('Failed to get members with role:', error);
        return [];
    }
}

module.exports = {
    assignGateRole,
    assignAscendedRole,
    removeAllGateRoles,
    hasRole,
    userHasRole,
    getMembersWithRole,
};
