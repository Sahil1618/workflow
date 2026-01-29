// Get all workspaces for user

import prisma from "../configs/prisma.js";

export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: userId } },
      },
      include: {
        members: { include: { user: true } },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,
                comments: { include: { user: true } },
              },
            },
            members: { include: { user: true } },
          },
        },
        owner: true,
      },
    });
    res.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};

// Add member to workspace
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { workspaceId, email, role, message } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!workspaceId || !role) {
      return res
        .status(400)
        .json({ error: "workspaceId and role are required" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Fetch Workespace

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check creator has admin role
    if (
      !workspace.members.find(
        (member) => member.userId === userId && member.role === "ADMIN",
      )
    ) {
      return res
        .status(403)
        .json({ error: "You don't have permission to add members" });
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(
      (member) => member.userId === user.id,
    );
    if (existingMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of the workspace" });
    }
    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });
    res.json({ member, message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
};
