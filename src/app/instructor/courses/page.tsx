import { cacheLife } from "next/cache";
import { Suspense } from "react";

import {
  CourseSetup,
  CourseSetupSkeleton,
} from "@/app/instructor/courses/course-setup";
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
    <h1 className="text-display rise-in mt-4.5 font-bold">Courses</h1>
    <p className="text-body text-subtitle rise-in mt-3 [--i:1]">
      Set up a course, add assignments and enrol students by email.
    </p>
    <Suspense fallback={<CourseSetupSkeleton />}>
      <Courses />
    </Suspense>
  </>
);

export default CoursesPage;
