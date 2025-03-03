#!/usr/bin/env python

from argparse import ArgumentParser


def cli():
    parser = ArgumentParser()
    parser.add_argument("file", help="Input file")
    args = parser.parse_args()
    return args


def main():
    args = cli()
    print(args.file)


if __name__ == "__main__":
    main()
