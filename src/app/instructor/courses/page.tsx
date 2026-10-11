import { cacheLife } from "next/cache";
import { Suspense } from "react";

import {
  CourseSetup,
  CourseSetupSkeleton,
} from "@/app/instructor/courses/course-setup";
import { PageBar } from "@/components/shell/page-bar";
import { requireRole } from "@/lib/auth";
import { coursesQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

const getCourses = async (userId: string) => {
  "use cache: private";
  cacheLife({ stale: 300 });
  const courses = await coursesQuery(await createClient(), userId).queryFn();
  return { courses, fetchedAt: Date.now() };
};

const Courses = async () => {
  const { id } = await requireRole("instructor");
  const { courses, fetchedAt } = await getCourses(id);
  return (
    <CourseSetup fetchedAt={fetchedAt} initialCourses={courses} userId={id} />
  );
};

const CoursesPage = () => (
  <>
    <PageBar crumbs={[{ label: "Courses" }]} />
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 max-md:px-4">
      <h1 className="text-title font-semibold">Courses</h1>
      <p className="text-muted-foreground mt-1.5 max-w-160 text-pretty">
        Set up a course, add assignments and enrol students by email.
      </p>
      <Suspense fallback={<CourseSetupSkeleton />}>
        <Courses />
      </Suspense>
    </div>
  </>
);

export default CoursesPage;
