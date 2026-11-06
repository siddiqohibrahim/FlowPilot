
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRO_LIMITS = {
    admin: 3,
    member: 2,
} as const;

type Plan = "free" | "pro" | "team";
type MemberRole = "admin" | "member";

function normalizePlan(value: unknown): Plan {
    if (typeof value !== "string") return "free";

    const plan = value.trim().toLowerCase();

    if (plan === "pro" || plan === "team") return plan;

    return "free";
}

function jsonError(message: string, status: number) {
    return Response.json({ error: message }, { status });
}

export default {
    fetch: withSupabase(
        { auth: "user" },
        async (req, ctx) => {
            if (req.method !== "POST") {
                return jsonError("Method not allowed.", 405);
            }

            try {
                const body = await req.json();

                const {
                    name,
                    email,
                    role,
                    action,
                    invitation_id,
                    workspace_owner_id,
                } = body;

                const userId = ctx.userClaims?.id;

                const userEmail =
                    typeof ctx.userClaims?.email === "string"
                        ? ctx.userClaims.email.trim().toLowerCase()
                        : "";

                if (!userId || !userEmail) {
                    return jsonError(
                        "Please sign in again.",
                        401,
                    );
                }

                // ACCEPT AN INVITATION
                if (action === "accept") {
                    if (
                        typeof invitation_id !== "string" ||
                        !invitation_id.trim()
                    ) {
                        return jsonError(
                            "A valid invitation ID is required.",
                            400,
                        );
                    }

                    const { data: invitation, error } =
                        await ctx.supabaseAdmin
                            .from("team_members")
                            .select("id")
                            .eq("id", invitation_id.trim())
                            .eq("member_email", userEmail)
                            .eq("invitation_status", "pending")
                            .maybeSingle();

                    if (error) throw error;

                    if (!invitation) {
                        return jsonError(
                            "This invitation is invalid, already used, or belongs to another email.",
                            404,
                        );
                    }

                    const { data: accepted, error: acceptError } =
                        await ctx.supabaseAdmin
                            .from("team_members")
                            .update({
                                invitation_status: "accepted",
                                workspace_member_id: userId,
                            })
                            .eq("id", invitation.id)
                            .eq("member_email", userEmail)
                            .eq("invitation_status", "pending")
                            .select("id")
                            .maybeSingle();

                    if (acceptError) throw acceptError;

                    if (!accepted) {
                        return jsonError(
                            "This invitation has already been processed.",
                            409,
                        );
                    }

                    return Response.json({
                        success: true,
                        message: "Invitation accepted successfully.",
                    });
                }

                if (action !== undefined && action !== null) {
                    return jsonError("Invalid action.", 400);
                }

                // VALIDATE INVITATION DETAILS
                const memberName =
                    typeof name === "string" ? name.trim() : "";

                const memberEmail =
                    typeof email === "string"
                        ? email.trim().toLowerCase()
                        : "";

                if (
                    !memberName ||
                    memberName.length > 80 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)
                ) {
                    return jsonError(
                        "Enter a valid name and email address.",
                        400,
                    );
                }

                if (
                    role !== undefined &&
                    role !== "admin" &&
                    role !== "member"
                ) {
                    return jsonError(
                        "Choose a valid team role.",
                        400,
                    );
                }

                const memberRole: MemberRole =
                    role === "admin" ? "admin" : "member";

                if (memberEmail === userEmail) {
                    return jsonError(
                        "You cannot invite your own email address.",
                        400,
                    );
                }

                // DETERMINE WORKSPACE AND CALLER ROLE
                const workspaceOwnerId =
                    typeof workspace_owner_id === "string" &&
                    workspace_owner_id.trim()
                        ? workspace_owner_id.trim()
                        : userId;

                const isWorkspaceOwner =
                    workspaceOwnerId === userId;

                let callerRole: string = "owner";

                if (!isWorkspaceOwner) {
                    const { data: membership, error } =
                        await ctx.supabaseAdmin
                            .from("team_members")
                            .select("member_role")
                            .eq(
                                "workspace_owner_id",
                                workspaceOwnerId,
                            )
                            .eq("workspace_member_id", userId)
                            .eq("invitation_status", "accepted")
                            .maybeSingle();

                    if (error) throw error;

                    if (!membership) {
                        return jsonError(
                            "You are not an accepted member of the selected workspace.",
                            403,
                        );
                    }

                    callerRole = membership.member_role;
                }

                // ONLY THE OWNER OR AN ADMIN CAN INVITE
                if (
                    !isWorkspaceOwner &&
                    callerRole !== "admin"
                ) {
                    return jsonError(
                        "Only the workspace owner or an admin can invite team members.",
                        403,
                    );
                }

                // LOAD THE WORKSPACE OWNER
                const { data: ownerResult, error: ownerError } =
                    await ctx.supabaseAdmin.auth.admin.getUserById(
                        workspaceOwnerId,
                    );

                if (ownerError) throw ownerError;

                const workspaceOwner = ownerResult.user;

                if (!workspaceOwner) {
                    return jsonError(
                        "The workspace owner could not be found.",
                        404,
                    );
                }

                const ownerEmail =
                    workspaceOwner.email?.trim().toLowerCase();

                if (ownerEmail && memberEmail === ownerEmail) {
                    return jsonError(
                        "You cannot invite the workspace owner's email address.",
                        409,
                    );
                }

                // DEMO PLAN SOURCE
                // Before paid launch, use a trusted subscription
                // table instead of editable Auth user metadata.
                const plan = normalizePlan(
                    workspaceOwner.user_metadata?.selected_plan,
                );

                // ENFORCE PLAN LIMITS
                if (plan === "free") {
                    return jsonError(
                        "Team invitations are not available on the Free plan. Upgrade to Pro to invite team members.",
                        403,
                    );
                }

                if (plan === "pro") {
                    const roleLimit = PRO_LIMITS[memberRole];

                    const { count, error: countError } =
                        await ctx.supabaseAdmin
                            .from("team_members")
                            .select("id", {
                                count: "exact",
                                head: true,
                            })
                            .eq(
                                "workspace_owner_id",
                                workspaceOwnerId,
                            )
                            .eq("member_role", memberRole)
                            .in("invitation_status", [
                                "pending",
                                "accepted",
                            ]);

                    if (countError) throw countError;

                    const currentCount = count ?? 0;

                    if (currentCount >= roleLimit) {
                        const roleName =
                            memberRole === "admin"
                                ? "administrators"
                                : "regular members";

                        return jsonError(
                            `Your Pro plan allows up to ${roleLimit} ${roleName}. You already have ${currentCount} pending or accepted ${roleName}. Upgrade to the Team plan for unlimited invitations.`,
                            403,
                        );
                    }
                }

                // TEAM PLAN HAS NO INVITATION COUNT LIMIT.

                // CREATE THE PENDING INVITATION
                const { data: invitation, error: insertError } =
                    await ctx.supabaseAdmin
                        .from("team_members")
                        .insert({
                            workspace_owner_id: workspaceOwnerId,
                            member_name: memberName,
                            member_email: memberEmail,
                            member_role: memberRole,
                            invitation_status: "pending",
                        })
                        .select("id")
                        .single();

                if (insertError) {
                    if (insertError.code === "23505") {
                        return jsonError(
                            "This email already has an invitation or membership in your workspace.",
                            409,
                        );
                    }

                    console.error(
                        "Invitation record error:",
                        insertError,
                    );

                    throw insertError;
                }

                // LOCAL DEVELOPMENT REDIRECT.
                // Change this to your deployed website URL before launch.
                const redirectTo =
                    "http://127.0.0.1:5500/accept-invitation.html" +
                    `?invitation_id=${encodeURIComponent(invitation.id)}`;

                let emailError: Error | null = null;

                // SEND THE INVITATION EMAIL
                const { error: inviteError } =
                    await ctx.supabaseAdmin.auth.admin
                        .inviteUserByEmail(memberEmail, {
                            data: {
                                full_name: memberName,
                            },
                            redirectTo,
                        });

                if (inviteError) {
                    const message =
                        inviteError.message.toLowerCase();

                    const existingUser =
                        message.includes("already registered") ||
                        message.includes("already been registered");

                    if (existingUser) {
                        const supabaseUrl =
                         Deno.env.get("SUPABASE_URL");
                            
                        const supabaseAnonKey =
                          Deno.env.get("SUPABASE_ANON_KEY");

                        if (!supabaseUrl || !supabaseAnonKey) {
                            throw new Error(
                                "Supabase URL or anon key is missing from the function environment.",
                            );
                        }

                        const publicClient = createClient(
                            supabaseUrl,
                            supabaseAnonKey,
                            {
                                auth: {
                                    autoRefreshToken: false,
                                    persistSession: false,
                                },
                            },
                        );

                        const { error: magicLinkError } =
                            await publicClient.auth
                                .signInWithOtp({
                                    email: memberEmail,
                                    options: {
                                        shouldCreateUser: false,
                                        emailRedirectTo: redirectTo,
                                    },
                                });

                        emailError = magicLinkError;
                    } else {
                        emailError = inviteError;
                    }
                }

                // REMOVE THE PENDING ROW IF EMAIL DELIVERY FAILS
                if (emailError) {
                    const { error: cleanupError } =
                        await ctx.supabaseAdmin
                            .from("team_members")
                            .delete()
                            .eq("id", invitation.id)
                            .eq(
                                "workspace_owner_id",
                                workspaceOwnerId,
                            );

                    if (cleanupError) {
                        console.error(
                            "Invitation cleanup error:",
                            cleanupError,
                        );
                    }

                    console.error(
                        "Invitation email error:",
                        emailError,
                    );

                    return jsonError(
                        "The invitation could not be emailed. Please try again.",
                        502,
                    );
                }

                return Response.json({
                    success: true,
                    message: "Invitation email sent successfully.",
                    plan,
                });
            } catch (error) {
                console.error(
                    "Invitation function error:",
                    error,
                );

                return jsonError(
                    "Unable to process the invitation. Please try again.",
                    500,
                );
            }
        },
    ),
};
