export async function generateStudentCode(client, schoolId, slug = "VIDY") {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS total FROM students WHERE school_id = $1",
    [schoolId]
  );
  const next = String((rows[0]?.total || 0) + 1).padStart(4, "0");
  const prefix = slug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "VIDY";
  return `${prefix}-${year}-${next}`;
}
