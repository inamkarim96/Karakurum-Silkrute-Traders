const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const cache = require("../../utils/cache");

async function listTeamMembers({ includeInactive = false } = {}) {
  const cacheKey = includeInactive ? "team:list:all" : "team:list";
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const members = await prisma.team_members.findMany({
    where: includeInactive ? {} : { is_active: true },
    orderBy: { sort_order: "asc" }
  });

  await cache.set(cacheKey, members, "EX", 3600);
  return members;
}

async function getTeamMemberById(id) {
  const member = await prisma.team_members.findUnique({ where: { id } });
  if (!member) {
    throw new ApiError(404, "Team member not found", "TEAM_MEMBER_NOT_FOUND");
  }
  return member;
}

async function createTeamMember(payload) {
  const count = await prisma.team_members.count();
  const member = await prisma.team_members.create({
    data: {
      name: payload.name,
      title: payload.title,
      photo_url: payload.photo_url || null,
      bio: payload.bio || null,
      is_active: payload.is_active ?? true,
      sort_order: typeof payload.sort_order === 'string' ? parseInt(payload.sort_order, 10) : (payload.sort_order ?? count)
    }
  });
  await cache.clearPattern("team:list");
  return member;
}

async function updateTeamMember(id, payload) {
  const existing = await prisma.team_members.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Team member not found", "TEAM_MEMBER_NOT_FOUND");
  }

  const member = await prisma.team_members.update({
    where: { id },
    data: { 
      ...payload, 
      sort_order: typeof payload.sort_order === 'string' ? parseInt(payload.sort_order, 10) : payload.sort_order,
      updated_at: new Date() 
    }
  });
  await cache.clearPattern("team:list");
  return member;
}

async function deleteTeamMember(id) {
  const existing = await prisma.team_members.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Team member not found", "TEAM_MEMBER_NOT_FOUND");
  }
  await prisma.team_members.delete({ where: { id } });
  await cache.clearPattern("team:list");
}

module.exports = {
  listTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
