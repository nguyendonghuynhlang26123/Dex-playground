import { Disclosure, Transition } from '@headlessui/react';
import { BiChevronUp } from 'react-icons/bi';

export function CollapsePanel({ children, title }) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between rounded-lg text-left px-4 py-2 hover:bg-gray-200">
            <span>{title}</span>
            <BiChevronUp className={`${open ? 'rotate-180 transform' : ''}`} />
          </Disclosure.Button>

          <hr />
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="px-3 py-2">{children}</Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}
