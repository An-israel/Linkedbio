export function Footer({ name }: { name: string }) {
  return (
    <footer className="mt-12 pb-10">
      <hr className="border-0 border-t border-steel" />
      <p className="mono-label text-center mt-5 text-mist">
        © {new Date().getFullYear()} {name}
      </p>
    </footer>
  )
}
