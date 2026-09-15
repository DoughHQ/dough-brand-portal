import '@/components/portal/skeleton_bones.css'

/** Shared shimmer block for portal `*_skeleton` screens. */
export default function SkeletonBone({ className = '' }: { className?: string }) {
  return <span className={`skel-bone ${className}`.trim()} aria-hidden />
}
