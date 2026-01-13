const { Events } = require('discord.js');
const config = require('../config');
const { userOps } = require('../database');
const { createWelcomeEmbed } = require('../components/flows/gatewayFlow');
const { createWelcomeButton } = require('../components/builders/gatewayComponents');

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

        // Send welcome message with "Begin Your Journey" button
        // Try waiting room first, then DM as fallback
        try {
            let welcomeSent = false;

            // Try to send to waiting room channel
            if (config.channels.waitingRoom) {
                const waitingRoom = member.guild.channels.cache.get(config.channels.waitingRoom);
                if (waitingRoom) {
                    const embed = createWelcomeEmbed(member.user.username);
                    const components = [createWelcomeButton()];

                    await waitingRoom.send({
                        content: `<@${member.id}>`,
                        embeds: [embed],
                        components,
                    });
                    welcomeSent = true;
                    console.log(`✧ Sent welcome message to ${member.user.tag} in waiting room`);
                }
            }

            // Fallback to DM if no waiting room
            if (!welcomeSent) {
                try {
                    const dm = await member.user.createDM();
                    const embed = createWelcomeEmbed(member.user.username);
                    const components = [createWelcomeButton()];

                    await dm.send({
                        embeds: [embed],
                        components,
                    });
                    console.log(`✧ Sent welcome DM to ${member.user.tag}`);
                } catch (dmError) {
                    console.log(`✧ Could not DM ${member.user.tag} (DMs disabled)`);
                }
            }
        } catch (error) {
            console.error('Failed to send welcome message:', error.message);
        }

        console.log(`✧ ${member.user.tag} joined the server`);
    },
};
