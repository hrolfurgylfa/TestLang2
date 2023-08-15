# TestLang2

This repo is my second attempt at designing and making an interpreter for my own
programming language.

## Features

### Unless > if

Why do an if statement where the condition comes before the code that might
execute? Why not have the code to execute first and then the condition that
controls whether the code is run after it like this:

```
{
    // Some calculations...
} unless 1 == 2;
```

In this example, nothing is run, and you can even continue the expression as far
as you want, like else if statements.

```
{
    // Some calculations...
} unless 1 == 2 then {
    // Other calculations...
} unless 1 == 3 then {
    // The third calculations, this gets run
}
```

Unless statements should also work as an expression, but that is still on the
to-do list.

### Come from

goto is cool, but feels a bit outdated, however, INTERCAL has had the solution
all along, we just weren't paying attention. Instead of goto, come from is a
much better way to jump between locations in code.

This is still a work in progress, but the plan is that the first token in a
comment will be used as the location to come from, so in this snippet the print
is skipped over.

```
// This is not just a comment
print(42);
come from This;
```

## What should this language be used for?

***Absolutely nothing.***

I got some inspiration from [this talk](https://youtu.be/vcFBwt1nu2U), to try to
make an interpreter for a similar language. This isn't trying to make an
interpreter for the language designed in that talk, but I just wanted to try
taking some of those features into a real programming language that can be
interpreted and run.

## Why TypeScript?

Why not? I know it's a really stupid choice for an interpreter, however, I
haven't played around with TypeScript before, so I decided to try it for this
project and see how it would go. Doing this in typescript has helped me learn
a lot about its type system, because of how much I need to bend it to my needs in
order to use it like a functional programming language.
