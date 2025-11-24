import { prisma } from "@caseflow/db";

export default async function Home() {
  const user = await prisma.user.findFirst()
  return (
    <div className="text-4xl ">
      {user?.name ?? "No user added yet"}
    </div>
  );
}