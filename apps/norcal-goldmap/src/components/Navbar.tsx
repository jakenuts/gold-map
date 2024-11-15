'use client';

import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md h-16 flex items-center px-4">
      <div className="flex items-center gap-3">
        <Image 
          src="/globe.svg"
          alt="Gold Map Logo"
          width={32}
          height={32}
          className="dark:invert"
        />
        <h1 className="text-xl font-semibold">NorCal Gold Map</h1>
      </div>
    </nav>
  );
};

export default Navbar;
