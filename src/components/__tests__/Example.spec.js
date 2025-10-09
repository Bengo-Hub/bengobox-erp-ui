import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import Example from './Example.vue';

import { nextTick } from 'vue';

it('renders properly', async () => {
    const wrapper = mount(Example, {
        props: { msg: 'Hello Vue 3' }
    });
    await nextTick();
    expect(wrapper.text()).toContain('Hello Vue 3');
});
