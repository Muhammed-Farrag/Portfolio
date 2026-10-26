// Contact: the links, and the message form's checks and email-app delivery.
import { expect, test } from './fixtures';

test('links email, LinkedIn and GitHub', async ({ page }) => {
  await page.goto('/#contact');
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: /mohamed\.frage19@gmail\.com/ })).toHaveAttribute('href', 'mailto:mohamed.frage19@gmail.com');
  await expect(contact.getByRole('link', { name: /in\/muhammed-farrag-/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/muhammed-farrag-/');
  await expect(contact.getByRole('link', { name: /github\.com\/Muhammed-Farrag/ })).toHaveAttribute('href', 'https://github.com/Muhammed-Farrag');
});

test('the form names each missing part and moves focus to the first', async ({ page }) => {
  await page.goto('/#contact');
  const form = page.locator('form.form');
  await form.getByRole('textbox', { name: 'Email' }).fill('sara@');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await expect(form.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByText('Please add your name.')).toBeVisible();
  await expect(form.getByText(/email address I can reply to/)).toBeVisible();
  await expect(form.getByText(/at least 10 characters/)).toBeVisible();
});

test('a complete message offers every way to send it, with or without a mail app', async ({ page }) => {
  await page.goto('/#contact');
  const form = page.locator('form.form');
  await form.getByRole('textbox', { name: 'Name' }).fill('Sara');
  await form.getByRole('textbox', { name: 'Email' }).fill('sara@example.com');
  await form.getByRole('textbox', { name: 'Message' }).fill('Hello, I would like to talk about a project.');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('status')).toContainText('Choose how to send it');
  await expect(form.getByRole('link', { name: 'Email app' })).toHaveAttribute('href', /^mailto:mohamed\.frage19@gmail\.com\?subject=Portfolio%20message%20from%20Sara/);
  await expect(form.getByRole('link', { name: /Gmail/ })).toHaveAttribute('href', /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=mohamed\.frage19%40gmail\.com/);
  await expect(form.getByRole('link', { name: /Outlook\.com/ })).toHaveAttribute('href', /^https:\/\/outlook\.live\.com\/mail\/0\/deeplink\/compose\?to=/);
  await expect(form.getByRole('button', { name: 'Copy the message' })).toBeVisible();
});

test('the words span the width; the links sit on the left and the form on the right on wide screens; stacked on phones', async ({ page }, info) => {
  await page.goto('/#contact');
  const details = (await page.locator('.contact__links').boundingBox())!;
  const form = (await page.locator('.contact .form').boundingBox())!;
  if (info.project.name.includes('mobile')) expect(form.y).toBeGreaterThan(details.y + details.height - 1);
  else expect(form.x).toBeGreaterThan(details.x + details.width - 1);
});

test('on wide screens the links panel is exactly as tall as the form', async ({ page }, info) => {
  test.skip(info.project.name.includes('mobile'), 'side by side on wide screens only');
  await page.goto('/#contact');
  // The links rise in with the scroll reveal (0.8 s): measure once they have settled.
  const gap = async () => {
    const links = (await page.locator('.contact__links').boundingBox())!;
    const form = (await page.locator('.contact .form').boundingBox())!;
    return Math.max(Math.abs(links.height - form.height), Math.abs(links.y - form.y));
  };
  await expect.poll(gap).toBeLessThanOrEqual(2);
});
