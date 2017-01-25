
# CommandRay

CommandRay is a tool that tries to combine best parts of CLI and GUI interfaces. It parses manual pages and generates UI that enables to type in command options in an interactive way. Read a [blog post](http://dundalek.com/entropic/combining-cli-and-gui/) for more details and rationale.

## Install

```
npm install -g commandray
```

Then build a local command database with:
```
commandray-extract
```

Built-in parser supports heroku and docker commands. Other commands are supported via [explainshell](https://github.com/idank/explainshell), refer to detailed instructions how to set it up below.

## Use

You can use `commandray` or the `ic` alias (as in **I**nteractive **C**ommand). This will open up the list of all available commands.

```
ic
```

You can type to search. Use up/down arrow keys to browse through commands, enter key to select a command. Once you select a command you will get to the form screen where you can see and fill out the command options.

Once you fill in the form you can select submit, the app exits and the command with selected arguments will be type out in your shell. You can have a final look and execute the command with enter. If you want to get back to main screen press escape key. To quit the app without selecting a command press ctrl+c.

You can type in the command name and the tree view will be filtered down to the query or you will get to the form screen if the input matches specific command.

```
ic heroku

```

You can also type in command with arguments which will open the form screen with those values filled in. This is useful to review commands you find on the internet before executing them.

```
ic heroku apps:create example -r prod
```

## Technical notes

### Limitations

Manual pages use similar conventions but have slight variations which makes parsing a bit difficult. Therefore some options can be missing or inaccurate. Another thing the Explainshell parser does not support are nested commands. The way to solve these is to create an improved parser and customize it as support for more commands is added.

### Explainshell

Instructions to setup and load commands with explainshell. It requires python and mongodb. Explainshell works by extracting manual pages of all programs available in Ubuntu package repositories.

1. [Setup explainshell](https://github.com/idank/explainshell#running-explainshell-locally)
2. Extract list of all manpages with [extractgzlist](https://github.com/idank/explainshell/blob/master/tools/extractgzlist). You can choose which Ubuntu release to use and which section of manpages to extract.
2. Download manpages from the list with [dlgzlist](https://github.com/idank/explainshell/blob/master/tools/dlgzlist).
3. Parse and load manpages into explainshell:
`ls manpages/*.gz | PYTHONPATH=. xargs python explainshell/manager.py --log info`

### Development

Clone the git repository:

```bash
git clone https://github.com/dundalek/commandray.git
cd commandray
npm install
```

Then build a local command database:

```
npm run extract
```

Example of converting manpage to plain text:
`man -l manpages/pandoc.1.gz`

Example of converting manpage to html:
`W3MMAN_MAN="man --no-hyphenation" ./tools/w3mman2html.cgi local=$PWD/manpages/pandoc.1.gz > tmp/pandoc.1.html`

## Roadmap

GUI
- [ ] Use shell completion to provide possible input values
- [ ] Filter down / search options in edit mode
- [ ] In-app help page
- [ ] Bottom bar showing keyboard shortcuts

Backend
- [ ] Improved parser (probably similar to docopt)
- [ ] Explore other kinds of command invocation like APIs or RPCs
- [ ] Support curated recipes / bookmarks
- [ ] Read shell history and offer recent or most used commands

## Related projects

- [Kaptain](http://kaptain.sourceforge.net/) is a universal graphical front-end for command line programs. It has its own DSL to define interfaces for commands in a form of context-free grammar. It is implemented in Qt4.
- [Goey](https://github.com/chriskiehl/Gooey) is a library that generates GUIs for commad-line programs written in python. It works be hooking into argparse declarations and renders the GUI via wxWidgets.
- [Inquirer.js](https://github.com/sboudrias/Inquirer.js) is a library for node.js that allows building command-lince interfaces, using interactive question prompts. I find the idea to build more intuitive interface interesting, but I think the prompt-based interfaces are too limiting and slow to use.
- [CCFE](http://ccfe.altervista.org/en/index.html) stands for the Curses Command Front-end. It is a tool that presents curses-based menus with form prompts. Menus and command options are specified in a custom DSL. The tool is written in perl. The disadvantage is that it does not automatically infer any options, but I like the curated recipes idea.

## Reading

- [Command line vs. GUI comparison table](http://www.computerhope.com/issues/ch000619.htm)
- [GUI vs. Command line interface](http://www.softpanorama.org/OFM/gui_vs_command_line.shtml)
- [Command-line interface on Wikipedia](https://en.wikipedia.org/wiki/Command-line_interface)
