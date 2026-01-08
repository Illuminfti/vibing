const { Events } = require('discord.js');
const config = require('../config');
const { userOps } = require('../database');

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        // Create user entry in database
        userOps.getOrCreate(member.id, member.user.username);

        // Assign Lost Soul role if configured
        if (config.roles.lostSoul) {
            try {
                const role = member.guild.roles.cache.get(config.roles.lostSoul);
                if (role) {
                    await member.roles.add(role);
                    console.log(`✧ ${member.user.tag} joined and received Lost Soul role`);
                }
            } catch (error) {
                console.error('Failed to assign Lost Soul role:', error);
            }
        }

        console.log(`✧ ${member.user.tag} joined the server`);
    },
};
