import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const ACTIVE_ASSIGNMENT_STATUSES = ["Assigned", "In Progress"];
const AVATAR_TONES = [
  "teal",
  "sky",
  "lime",
  "amber",
  "violet",
  "rose",
  "cyan",
  "emerald",
];

// Demo portraits are only a fallback; user-uploaded profile pictures take priority below.
const EMPLOYEE_PHOTOS = {
  "demo-employee": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-2": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-3": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-4": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-5": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-6": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-7": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-8": "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-9": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-10": "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=360&h=360&q=80",
  "demo-employee-11": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=360&h=360&q=80",
};

function initials(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TN";
}

function scoreFromSkill(skills, skillName) {
  const match = skills.find((skill) => String(skill.skill_name ?? "").toLowerCase().includes(skillName));
  return Math.min(100, Math.max(0, Number(match?.proficiency_level ?? 0) * 20));
}

function buildAbilities(employee, skills, availability, activeAssignments) {
  const availableRows = availability.filter((row) => String(row.status ?? "").toLowerCase() !== "unavailable");
  const availabilityScore = availability.length === 0 ? 55 : Math.min(100, 40 + availableRows.length * 18);
  const readinessScore = employee.account_status === "Active" ? 88 : 24;
  const loadScore = Math.max(20, 100 - activeAssignments * 24);

  return [
    { key: "customer", label: "Customer", score: scoreFromSkill(skills, "customer") },
    { key: "inventory", label: "Inventory", score: scoreFromSkill(skills, "inventory") },
    { key: "availability", label: "Availability", score: availabilityScore },
    { key: "readiness", label: "Readiness", score: readinessScore },
    { key: "capacity", label: "Capacity", score: loadScore },
  ];
}

function groupByUserId(rows = []) {
  return rows.reduce((map, row) => {
    const userId = row.user_id;
    if (!userId) return map;
    map[userId] = [...(map[userId] ?? []), row];
    return map;
  }, {});
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data: employeeRole } = await supabase
      .from("role")
      .select("role_id")
      .ilike("role_name", "employee")
      .maybeSingle();

    let query = supabase
      .from("user_account")
      .select("user_id, username, email, account_status, subscription_tier, role:role_id(role_name)");

    if (employeeRole?.role_id) {
      query = query.eq("role_id", employeeRole.role_id);
    }

    const { data, error } = await query.order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const employees = data ?? [];
    const employeeIds = employees.map((employee) => employee.user_id).filter(Boolean);

    if (employeeIds.length === 0) {
      return NextResponse.json({ employees: [] });
    }

    const [
      { data: profiles, error: profilesError },
      { data: availability, error: availabilityError },
      { data: userSkills, error: userSkillsError },
      { data: skillRows, error: skillRowsError },
      { data: assignments, error: assignmentsError },
    ] = await Promise.all([
      supabase.from("profile").select("*").in("user_id", employeeIds),
      supabase.from("availability").select("*").in("user_id", employeeIds),
      supabase.from("user_skill").select("*").in("user_id", employeeIds),
      supabase.from("skill").select("*"),
      supabase.from("task_assignment").select("assignment_id, user_id, status").in("user_id", employeeIds),
    ]);

    const lookupError = profilesError || availabilityError || userSkillsError || skillRowsError || assignmentsError;

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }

    const profilesByUserId = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const availabilityByUserId = groupByUserId(availability ?? []);
    const assignmentsByUserId = groupByUserId(assignments ?? []);
    const skillsById = Object.fromEntries((skillRows ?? []).map((skill) => [String(skill.skill_id), skill]));
    const userSkillsByUserId = groupByUserId(userSkills ?? []);

    return NextResponse.json({
      employees: employees.map((employee, index) => {
        const profile = profilesByUserId[employee.user_id] ?? null;
        const skills = (userSkillsByUserId[employee.user_id] ?? []).map((row) => ({
          skill_id: row.skill_id,
          skill_name: skillsById[String(row.skill_id)]?.skill_name ?? `Skill ${row.skill_id}`,
          description: skillsById[String(row.skill_id)]?.description ?? "",
          proficiency_level: Number(row.proficiency_level) || 0,
        }));
        const employeeAvailability = availabilityByUserId[employee.user_id] ?? [];
        const activeAssignmentCount = (assignmentsByUserId[employee.user_id] ?? []).filter((assignment) =>
          ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status),
        ).length;

        return {
          ...employee,
          profile,
          availability: employeeAvailability,
          skills,
          active_assignment_count: activeAssignmentCount,
          avatar: {
            initials: initials(employee.username || employee.email),
            tone: AVATAR_TONES[index % AVATAR_TONES.length],
            // Prefer uploaded avatars so account settings immediately affect the dispatch board.
            photoUrl: profile?.profile_picture_url || EMPLOYEE_PHOTOS[employee.user_id] || null,
            source: profile?.profile_picture_url
              ? "Uploaded profile"
              : EMPLOYEE_PHOTOS[employee.user_id]
                ? "Unsplash"
                : "Generated initials",
          },
          abilities: buildAbilities(employee, skills, employeeAvailability, activeAssignmentCount),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
