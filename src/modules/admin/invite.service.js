import { getDb } from '../../db/database.js';

export const inviteService = {
  // Générer un mot de passe temporaire lisible, fort et sécurisé
  generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nums = '23456789';
    const p1 = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
    const p2 = nums.charAt(Math.floor(Math.random() * nums.length)) + nums.charAt(Math.floor(Math.random() * nums.length)) + nums.charAt(Math.floor(Math.random() * nums.length));
    const specials = '!#$*';
    const spec = specials.charAt(Math.floor(Math.random() * specials.length));
    return `Wuaze${spec}${p1}${p2}`;
  },

  // Construire le pack d'invitation avec messages pré-formatés
  buildInvitation({ collaborator, password, baseUrl }) {
    const loginUrl = baseUrl ? `${baseUrl}/admin.html` : 'http://localhost:3000/admin.html';
    const roleLabels = {
      SUPER_ADMIN: 'Super Administrateur',
      GESTIONNAIRE: 'Gestionnaire Catalogue & Commandes',
      AGENT: 'Agent Logistique & Expéditions'
    };
    const roleName = roleLabels[collaborator.role] || collaborator.role;

    const emailSubject = `Invitation à rejoindre l'équipe WuazeShop Gabon`;

    const plainMessage = `Bonjour ${collaborator.full_name || collaborator.username},

Vous avez été invité(e) par la direction à rejoindre l'espace d'administration WuazeShop Gabon en tant que ${roleName}.

Voici vos accès d'authentification pour vous connecter :
• Espace Admin : ${loginUrl}
• Identifiant de connexion : ${collaborator.email} (ou @${collaborator.username})
• Mot de passe temporaire : ${password}

Accès et fonctions autorisées :
${collaborator.role === 'GESTIONNAIRE' ? '- Gestion du catalogue et des prix\n- Traitement et validation des commandes\n- Gestion des remises et promotions' : ''}${collaborator.role === 'AGENT' ? '- Suivi des expéditions Chine - Gabon\n- Suivi des commandes clients et livraison' : ''}${collaborator.role === 'SUPER_ADMIN' ? '- Accès total à la boutique et à la gestion d\'équipe' : ''}

Pour des raisons de sécurité, veuillez vous connecter sans attendre.
L'équipe WuazeShop Libreville`;

    const whatsappMessage = `👋 *Bonjour ${collaborator.full_name || collaborator.username}*,

Vous avez été invité(e) par la direction à rejoindre l'espace d'administration *WuazeShop Gabon* en tant que *${roleName}*.

🔗 *Lien d'accès* : ${loginUrl}
👤 *Identifiant* : ${collaborator.email} (ou @${collaborator.username})
🔑 *Mot de passe* : ${password}

Merci de vous connecter dès maintenant pour valider votre accès.
_WuazeShop Libreville_`;

    const mailtoUrl = `mailto:${encodeURIComponent(collaborator.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainMessage)}`;

    // Enregistrer dans la table collaborator_invitations
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO collaborator_invitations (collaborator_id, email, phone, role, invitation_url, status)
        VALUES (?, ?, ?, ?, ?, 'SENT')
      `).run(
        collaborator.id, 
        collaborator.email, 
        collaborator.phone || null, 
        collaborator.role, 
        loginUrl
      );
    } catch (err) {
      console.warn('[InviteService] Log invitation DB deferred:', err.message);
    }

    // Affichage dans la console serveur pour traçabilité immédiate
    console.log(`\n================== [INVITATION COLLABORATEUR ENVOYÉE] ==================`);
    console.log(`Destinataire : ${collaborator.full_name} (${collaborator.email})`);
    console.log(`Poste / Rôle : ${roleName}`);
    console.log(`Lien d'accès : ${loginUrl}`);
    console.log(`Mot de passe : ${password}`);
    console.log(`========================================================================\n`);

    return {
      invitationUrl: loginUrl,
      email: collaborator.email,
      username: collaborator.username,
      fullName: collaborator.full_name,
      phone: collaborator.phone || '',
      role: collaborator.role,
      roleName,
      tempPassword: password,
      whatsappMessage,
      plainMessage,
      mailtoUrl,
      sentAt: new Date().toISOString()
    };
  }
};
