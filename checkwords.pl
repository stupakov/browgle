#!/usr/bin/env perl
use strict;
use warnings;


# standalone script that looks for a word within a letter grid
#
# TO DO:
# - Handle 'Qu' case
# - Don't allow a letter to be used more than once
# - integrate this into browgle (server-side OR rewrite in javascript for client-side execution)


my @roll = qw(D O G S C A T S B E E R W I N E);
my @query = qw(C A T E E R) ;

my $squareSize = 4;


my $roll_string = join "", @roll;
my $query_string = join "", @query;

print "Is \"$query_string\" in the square \"$roll_string\"??  " . checkForWord(\@query, \@roll) . "\n";



# takes two references to arrays of chars: query and roll/grid
sub checkForWord {
    my @query = @{ $_[0] };
    my @roll = @{ $_[1] };

    for ( my $k = 0; $k < scalar ( @roll ); $k++ ) {
        my @path; #??
        if ( findStringAt( \@query, \@roll, $k, \@path ) ) {
            return 1;
        }
    }

    return 0;    
}

# function to recursively determine if a (sub)word exists in the grid, starting at a given position
# params:
# 1     reference to query(word) character array
# 2     reference to roll(grid) character array
# 3     grid index at which we wish to search for this word
# 4     reference to array containing grid indices of the path we took to get to the query
#              - used to avoid using the same square twice.
sub findStringAt {
    my @query = @{ $_[0] };
    my @roll = @{ $_[1] };
    my $index = $_[2];
    my @path = @{ $_[3] };

    # base case of recursion - empty string means we've matched all letters
    # that must be match so the word is found
    if ( scalar @query == 0 ) {
        return 1;
    }

    # string does not start with cell letter at that position
    if ( $roll[$index] ne $query[0] ) {
        return 0;
    }

    # see if we can find letters 2..end at any neighbor cell
    my $found = 0;
    foreach my $neighborIndex ( neighborCellIndices($index) ) {
        if ( ! grep {$_ eq $neighborIndex} @path) {
            my @shortenedQuery = @query[1..$#query];
            my @hypPath=@path; #?? is this an array copy?
            push @hypPath, $neighborIndex;
            if ( findStringAt ( \@shortenedQuery, \@roll, $neighborIndex, \@hypPath ) ) {
                $found = 1;
            } 
        }              
    }
    
    return $found;
}


# gives the indices of the neighbors of the cell with the given index.
# diagonal neighbors count as neighbors
sub neighborCellIndices {
    my $center = shift;
    my $row = int($center / $squareSize);
    my $col = $center % $squareSize;
    my @neighbors;
    for ( my $i = 0; $i < $squareSize ** 2; $i++ ) {
        my $i_row = int($i / $squareSize);
        my $i_col = $i % $squareSize;
        if ( (abs ( $i_row - $row ) < 2)  &&  (abs ( $i_col - $col ) < 2)  &&  ($i != $center)) {
            push @neighbors, $i;
        }
    }
    return @neighbors;
}
