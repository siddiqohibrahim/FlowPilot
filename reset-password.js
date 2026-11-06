// ========== FLOWPILOT PASSWORD RESET ==========

const SUPABASE_URL = "https://bydjqiqthfydzbjwjceo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_VWhxrjLcDynfLp1lWrsy1Q_YfOxSwP4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const updatePasswordButton =
    document.getElementById("updatePasswordButton");

const resetPasswordFeedback =
    document.getElementById("resetPasswordFeedback");


// Show feedback messages
function showResetFeedback(message, type) {
    resetPasswordFeedback.textContent = message;

    resetPasswordFeedback.className =
        type === "success"
            ? "mt-3 text-success"
            : "mt-3 text-danger";
}


// Check whether Supabase has a valid reset session
async function checkResetSession() {
    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error || !data.session) {
            showResetFeedback(
                "This password reset link is invalid or has expired. Please request a new one.",
                "error"
            );

            updatePasswordButton.disabled = true;
            return false;
        }

        return true;

    } catch (error) {
        console.error("Reset session error:", error);

        showResetFeedback(
            "Unable to verify your reset link. Please request a new one.",
            "error"
        );

        updatePasswordButton.disabled = true;
        return false;
    }
}


// Update the password
resetPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 8) {
        showResetFeedback(
            "Your password must contain at least 8 characters.",
            "error"
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showResetFeedback(
            "The passwords do not match.",
            "error"
        );
        return;
    }

    updatePasswordButton.disabled = true;
    updatePasswordButton.textContent = "Updating...";

    try {
        const sessionIsValid = await checkResetSession();

        if (!sessionIsValid) {
            return;
        }

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        resetPasswordForm.reset();

        showResetFeedback(
            "Your password has been updated successfully. You can now log in with your new password.",
            "success"
        );

        updatePasswordButton.textContent = "Password Updated";

        setTimeout(function () {
            window.location.replace("login.html");
        }, 2500);

    } catch (error) {
        console.error("Password update error:", error);

        showResetFeedback(
            error.message ||
            "Unable to update your password. Please try again.",
            "error"
        );

        updatePasswordButton.disabled = false;
        updatePasswordButton.textContent = "Update Password";
    }
});


// Verify the reset session when the page opens
checkResetSession();