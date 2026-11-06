// SUPABASE CONFIGURATION

const SUPABASE_URL = "https://bydjqiqthfydzbjwjceo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_VWhxrjLcDynfLp1lWrsy1Q_YfOxSwP4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// SELECT HTML ELEMENTS

const invitationMessage = document.getElementById(
    "invitationMessage"
);

const acceptInvitationButton = document.getElementById(
    "acceptInvitationButton"
);

const invitationLoginLink = document.getElementById(
    "invitationLoginLink"
);

// CHECK AND PROCESS THE INVITATION

async function checkInvitation() {
    const params = new URLSearchParams(
        window.location.hash.slice(1)
    );

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const tokenType = params.get("type");

    const invitationId = new URLSearchParams(
        window.location.search
    ).get("invitation_id");

    if (invitationId && invitationLoginLink) {
    invitationLoginLink.href =
        `login.html?invitation_id=${encodeURIComponent(invitationId)}`;
    }

    if (!invitationId) {
        invitationMessage.textContent =
            "The invitation ID is missing. Please open the invitation link from your email.";
        invitationMessage.className = "alert alert-danger";
        acceptInvitationButton.disabled = true;
        return;
    }

        if (
            accessToken &&
            refreshToken &&
            (tokenType === "invite" || tokenType === "magiclink")
        ) {
        const { error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error) {
            invitationMessage.textContent =
                "Your invitation link could not be verified. Please request a new invitation.";
            invitationMessage.className = "alert alert-danger";
            acceptInvitationButton.disabled = true;
            return;
        }

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
        );
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        invitationMessage.textContent =
            "Please open your invitation email link again, or sign in to your existing account.";
        invitationMessage.className = "alert alert-warning";
        acceptInvitationButton.disabled = true;
        return;
    }

    invitationMessage.textContent =
        "Your invitation link has been verified. You can now accept the invitation.";
    invitationMessage.className = "alert alert-success";
    acceptInvitationButton.disabled = false;
}

// ACCEPT THE WORKSPACE INVITATION

acceptInvitationButton.addEventListener("click", async function () {
    const invitationId = new URLSearchParams(
        window.location.search
    ).get("invitation_id");

    if (!invitationId) {
        invitationMessage.textContent =
            "The invitation ID is missing. Please open the invitation link from your email.";
        invitationMessage.className = "alert alert-danger";
        return;
    }

    acceptInvitationButton.disabled = true;
    acceptInvitationButton.textContent = "Accepting...";

    try {
        const { data, error } = await supabaseClient.functions.invoke(
            "smooth-handler",
            {
                body: {
                    action: "accept",
                    invitation_id: invitationId
                }
            }
        );

        if (error) throw error;

        if (data?.error) {
            throw new Error(data.error);
        }

        invitationMessage.textContent =
            "Invitation accepted! You're now a member of the workspace.";
        invitationMessage.className = "alert alert-success";

        acceptInvitationButton.textContent = "Invitation Accepted";

    } catch (error) {
        console.error("Accept invitation error:", error);

        invitationMessage.textContent =
            error.message || "Unable to accept the invitation. Please try again.";
        invitationMessage.className = "alert alert-danger";

        acceptInvitationButton.disabled = false;
        acceptInvitationButton.textContent = "Accept Invitation";
    }
});

checkInvitation();